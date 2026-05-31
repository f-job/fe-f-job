import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  ListGroup,
  Row,
  Spinner,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import chatService from '@services/chatService';
import {
  emitSendMessage,
  getChatSocket,
  onNewMessage,
  onSocketException,
  type NewMessageEvent,
} from '@services/chatSocket';
import { useAuthStore } from '@stores/authStore';
import { useChatStore } from '@stores/chatStore';
import type { ChatMessage, Conversation } from '@/types/api';
import { getEntityId, getRefId, getErrorMessage, timeAgo } from '@utils/format';

/** Resolve the other participant's display name for a conversation. */
function otherParticipantName(conv: Conversation, myId: string): string {
  // List endpoint exposes participantDetails; create/detail exposes populated participants.
  const pool = conv.participantDetails ?? [];
  if (pool.length > 0) {
    const other = pool.find((p) => getEntityId(p) !== myId);
    if (other) return other.fullName || other.email || 'Người dùng';
  }
  const otherRef = conv.participants.find((p) => getRefId(p) !== myId);
  if (otherRef && typeof otherRef === 'object') {
    return otherRef.fullName || otherRef.email || 'Người dùng';
  }
  return 'Người dùng';
}

/** Id of the other participant in a conversation (the non-me side). */
function otherParticipantId(conv: Conversation, myId: string): string {
  const pool = conv.participantDetails ?? [];
  const fromDetails = pool.find((p) => getEntityId(p) !== myId);
  if (fromDetails) return getEntityId(fromDetails);
  const otherRef = conv.participants.find((p) => getRefId(p) !== myId);
  return otherRef ? getRefId(otherRef) : '';
}

/**
 * A conversation is unique per CANDIDATE↔EMPLOYER pair, so the list should
 * never show two rows for the same person. Backend race conditions (or a
 * StrictMode double-create in dev) can leave duplicate documents — collapse
 * them here, keeping the most recently updated one.
 */
function dedupeConversations(list: Conversation[], myId: string): Conversation[] {
  const byOther = new Map<string, Conversation>();
  for (const conv of list) {
    const key = otherParticipantId(conv, myId) || getEntityId(conv);
    const existing = byOther.get(key);
    if (!existing) {
      byOther.set(key, conv);
      continue;
    }
    const a = new Date(conv.updatedAt ?? 0).getTime();
    const b = new Date(existing.updatedAt ?? 0).getTime();
    if (a >= b) byOther.set(key, conv);
  }
  return Array.from(byOther.values()).sort(
    (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
  );
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const myId = user?.id ?? '';
  const refreshUnreadCount = useChatStore((s) => s.refreshUnreadCount);

  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkRecipient = searchParams.get('to');
  const deepLinkConversation = searchParams.get('conversation');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  // Guard against StrictMode's double effect invocation creating two channels.
  const didInitRef = useRef(false);

  const scrollToBottom = () => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const loadConversations = useCallback(async () => {
    setLoadingConvos(true);
    try {
      const { data } = await chatService.list();
      const deduped = dedupeConversations(data.data, myId);
      setConversations(deduped);
      return deduped;
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải hội thoại'));
      return [];
    } finally {
      setLoadingConvos(false);
    }
  }, [myId]);

  /** Mark all unread inbound messages of a conversation as read. */
  const markInboundRead = useCallback(
    async (conversationId: string, msgs: ChatMessage[]) => {
      const unread = msgs.filter((m) => !m.isRead && getRefId(m.senderId) !== myId);
      if (unread.length === 0) return;
      await Promise.allSettled(
        unread.map((m) => chatService.markRead(conversationId, getEntityId(m))),
      );
      refreshUnreadCount();
    },
    [myId, refreshUnreadCount],
  );

  const loadMessages = useCallback(
    async (conversationId: string) => {
      setLoadingMsgs(true);
      try {
        const { data } = await chatService.messages(conversationId, 1, 50);
        // backend returns newest-first; render oldest-first
        const ordered = [...data.data].reverse();
        setMessages(ordered);
        scrollToBottom();
        await markInboundRead(conversationId, ordered);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể tải tin nhắn'));
      } finally {
        setLoadingMsgs(false);
      }
    },
    [markInboundRead],
  );

  // Initial load + deep-link handling + socket wiring
  useEffect(() => {
    // StrictMode invokes effects twice in dev; only run init once to avoid
    // creating duplicate conversations via the deep-link path.
    if (didInitRef.current) return;
    didInitRef.current = true;

    getChatSocket();

    (async () => {
      const list = await loadConversations();

      // Deep link: start/open a conversation with a specific recipient
      if (deepLinkRecipient) {
        try {
          const { data } = await chatService.create(deepLinkRecipient);
          const id = getEntityId(data);
          // Merge into list if it's new, then dedupe by participant pair.
          setConversations((prev) =>
            dedupeConversations(
              prev.some((c) => getEntityId(c) === id) ? prev : [data, ...prev],
              myId,
            ),
          );
          setActiveId(id);
        } catch (err) {
          toast.error(getErrorMessage(err, 'Không thể mở hội thoại'));
        }
        setSearchParams({}, { replace: true });
        return;
      }

      if (deepLinkConversation) {
        setActiveId(deepLinkConversation);
        setSearchParams({}, { replace: true });
        return;
      }

      if (list.length > 0) setActiveId(getEntityId(list[0]));
    })();

    const offMsg = onNewMessage((evt: NewMessageEvent) => {
      const { conversationId, message } = evt;
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => getEntityId(m) === getEntityId(message))) return prev;
          scrollToBottom();
          return [...prev, message];
        });
        // Inbound message in the open thread → mark read immediately
        if (getRefId(message.senderId) !== myId) {
          chatService.markRead(conversationId, getEntityId(message)).then(refreshUnreadCount);
        }
      } else if (getRefId(message.senderId) !== myId) {
        // Message for another thread → badge will pick it up
        refreshUnreadCount();
      }

      // Bubble preview into the conversation list (and reorder to top)
      setConversations((prev) => {
        const idx = prev.findIndex((c) => getEntityId(c) === conversationId);
        if (idx === -1) {
          loadConversations();
          return prev;
        }
        const updated: Conversation = {
          ...prev[idx],
          latestMessage: { text: message.text, createdAt: message.createdAt },
          updatedAt: message.createdAt,
        };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      });
    });

    const offExc = onSocketException((err) => {
      if (err.errorCode === 'ERR_1001') {
        toast.error('Phiên chat hết hạn, vui lòng đăng nhập lại.');
      }
    });

    return () => {
      offMsg();
      offExc();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep activeId ref in sync + load messages on switch
  useEffect(() => {
    activeIdRef.current = activeId;
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    // Server persists + echoes back the message via the `newMessage` event.
    emitSendMessage(activeId, text);
    setDraft('');
  };

  const handleHide = async (conv: Conversation) => {
    const id = getEntityId(conv);
    if (!window.confirm('Ẩn hội thoại này khỏi danh sách?')) return;
    try {
      await chatService.hide(id);
      setConversations((prev) => prev.filter((c) => getEntityId(c) !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      toast.success('Đã ẩn hội thoại');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ẩn hội thoại'));
    }
  };

  const activeConv = conversations.find((c) => getEntityId(c) === activeId) ?? null;

  return (
    <Container className="py-4">
      <h1 className="h3 fw-bold mb-3">Tin nhắn</h1>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm" style={{ height: '70vh' }}>
        <Row className="g-0 h-100">
          {/* Conversation list */}
          <Col md={4} className="border-end h-100 d-flex flex-column">
            <div className="p-3 border-bottom fw-bold">Hội thoại</div>
            <div className="flex-grow-1 overflow-auto">
              {loadingConvos ? (
                <div className="text-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-muted small text-center py-4 mb-0">Chưa có hội thoại nào.</p>
              ) : (
                <ListGroup variant="flush">
                  {conversations.map((c) => {
                    const id = getEntityId(c);
                    return (
                      <ListGroup.Item
                        key={id}
                        action
                        active={id === activeId}
                        onClick={() => setActiveId(id)}
                        className="d-flex gap-2 align-items-center"
                      >
                        <i className="bi bi-person-circle fs-4 text-secondary"></i>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="fw-500 text-truncate">
                            {otherParticipantName(c, myId)}
                          </div>
                          <div className="small text-muted text-truncate">
                            {c.latestMessage?.text ?? 'Bắt đầu trò chuyện'}
                          </div>
                        </div>
                        <span className="small text-muted">{timeAgo(c.updatedAt)}</span>
                        <Dropdown
                          onClick={(e) => e.stopPropagation()}
                          align="end"
                        >
                          <Dropdown.Toggle
                            as="span"
                            role="button"
                            className="text-muted no-caret"
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed' }}>
                            <Dropdown.Item onClick={() => handleHide(c)}>
                              <i className="bi bi-eye-slash me-2"></i>Ẩn hội thoại
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </div>
          </Col>

          {/* Message thread */}
          <Col md={8} className="h-100 d-flex flex-column">
            {!activeConv ? (
              <div className="d-flex flex-grow-1 align-items-center justify-content-center text-muted">
                Chọn một hội thoại để bắt đầu
              </div>
            ) : (
              <>
                <div className="p-3 border-bottom d-flex align-items-center gap-2">
                  <i className="bi bi-person-circle fs-4 text-secondary"></i>
                  <span className="fw-bold">{otherParticipantName(activeConv, myId)}</span>
                  <Badge bg="success" pill className="ms-auto" style={{ fontSize: '0.65rem' }}>
                    <i className="bi bi-broadcast me-1"></i>Realtime
                  </Badge>
                </div>

                <div className="flex-grow-1 overflow-auto p-3 bg-light">
                  {loadingMsgs ? (
                    <div className="text-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-muted small text-center">Chưa có tin nhắn nào.</p>
                  ) : (
                    messages.map((m) => {
                      const mine = getRefId(m.senderId) === myId;
                      return (
                        <div
                          key={getEntityId(m)}
                          className={`d-flex mb-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                          <div
                            className={`px-3 py-2 rounded-3 ${
                              mine ? 'bg-primary text-white' : 'bg-white border'
                            }`}
                            style={{ maxWidth: '75%' }}
                          >
                            <div>{m.text}</div>
                            <div
                              className={`text-end ${mine ? 'text-white-50' : 'text-muted'}`}
                              style={{ fontSize: '0.65rem' }}
                            >
                              {timeAgo(m.createdAt)}
                              {mine && m.isRead && <i className="bi bi-check2-all ms-1"></i>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <Form onSubmit={handleSend} className="p-3 border-top d-flex gap-2">
                  <Form.Control
                    placeholder="Nhập tin nhắn..."
                    value={draft}
                    maxLength={2000}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <Button type="submit" disabled={!draft.trim()} className="btn-primary-gradient">
                    <i className="bi bi-send"></i>
                  </Button>
                </Form>
              </>
            )}
          </Col>
        </Row>
      </Card>
    </Container>
  );
}
