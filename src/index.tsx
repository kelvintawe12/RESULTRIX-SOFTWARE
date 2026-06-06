import './index.css';
import { createRoot } from 'react-dom/client';
import App from './src/App';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');
createRoot(container).render(<App />);

// Register service worker for PWA (only in production)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
			.then(reg => {
				console.log('Service Worker registered:', reg);
			})
			.catch(err => {
				console.error('Service Worker registration failed:', err);
			});
	});
}