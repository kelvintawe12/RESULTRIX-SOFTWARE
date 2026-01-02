import React from 'react';
import './index.css';
import { render } from 'react-dom';
import App from './src/App';
render(<App />, document.getElementById('root'));

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