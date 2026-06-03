import { useRoutes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { routes } from './routes';

function App() {
  const element = useRoutes(routes);
  return <ThemeProvider>{element}</ThemeProvider>;
}

export default App;
