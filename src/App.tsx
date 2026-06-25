import { useRoutes } from 'react-router-dom';
import { ScrollToTop } from '@components/common/ScrollToTop';
import { ThemeProvider } from './contexts/ThemeContext';
import { routes } from './routes';

function App() {
  const element = useRoutes(routes);
  return (
    <ThemeProvider>
      <ScrollToTop />
      {element}
    </ThemeProvider>
  );
}

export default App;
