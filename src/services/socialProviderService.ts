// ─── Google types ────────────────────────────────────────────────────────────────

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
    };
  };
};

// ─── Facebook types ────────────────────────────────────────────────────────────

type FacebookAuthResponse = {
  accessToken?: string;
  code?: string;
};

type FacebookLoginResponse = {
  authResponse?: FacebookAuthResponse;
  status?: string;
};

type FacebookSdk = {
  init: (options: {
    appId: string;
    cookie: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: { scope: string }
  ) => void;
  logout: (callback: (response: unknown) => void) => void;
  api: (path: string, options: object, callback: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    google?: GoogleAccounts;
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

// ─── Popup helper ─────────────────────────────────────────────────────────────

function openPopup(url: string, width = 500, height = 600) {
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
  return window.open(
    url,
    'oauth_popup',
    `width=${width},height=${height},scrollbars=yes,left=${left},top=${top}`
  );
}


// ─── Google ────────────────────────────────────────────────────────────────────

const socialProviderService = {
  async getGoogleIdToken(): Promise<string> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      throw new Error('Thiếu VITE_GOOGLE_CLIENT_ID trong frontend .env');
    }

    // Use redirect flow — opens a popup to Google OAuth, then redirects to our callback
    const redirectUri = `${window.location.origin}/google-callback`;
    const state = crypto.randomUUID();

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'email profile openid');
    authUrl.searchParams.set('nonce', state);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('hd', ''); // allow any hosted domain

    const popup = openPopup(authUrl.toString());
    if (!popup) {
      throw new Error('Không thể mở popup đăng nhập Google. Vui lòng cho phép popup cho trang này.');
    }

    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Hết thời gian đăng nhập Google'));
      }, 5 * 60 * 1000);

      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener('message', messageHandler);
        popup.close();
      };

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_OAUTH_IDTOKEN' && event.data?.idToken) {
          cleanup();
          resolve(event.data.idToken);
        }
        if (event.data?.type === 'GOOGLE_OAUTH_ERROR') {
          cleanup();
          reject(new Error(event.data?.message || 'Đăng nhập Google thất bại'));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  },

  // ─── Facebook (OAuth 2.0 Redirect Flow) ────────────────────────────────────

  async getFacebookAccessToken(): Promise<string> {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
    if (!appId) {
      throw new Error('Thiếu VITE_FACEBOOK_APP_ID trong frontend .env');
    }

    // Use redirect flow for reliability (avoids popup blockers and SDK issues)
    const redirectUri = `${window.location.origin}/facebook-callback`;
    const state = crypto.randomUUID();

    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'email,public_profile');
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('state', state);

    const popup = openPopup(authUrl.toString());
    if (!popup) {
      throw new Error('Không thể mở popup đăng nhập Facebook. Vui lòng cho phép popup cho trang này.');
    }

    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Hết thời gian đăng nhập Facebook'));
      }, 5 * 60 * 1000); // 5 minutes

      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener('message', messageHandler);
        popup.close();
      };

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'FACEBOOK_OAUTH_TOKEN' && event.data?.token) {
          cleanup();
          resolve(event.data.token);
        }
        if (event.data?.type === 'FACEBOOK_OAUTH_ERROR') {
          cleanup();
          reject(new Error(event.data?.message || 'Đăng nhập Facebook thất bại'));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  },
};

export default socialProviderService;
