import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div style={{color:'white',display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#1a1a2e',fontFamily:'sans-serif'}}>加载中...</div>}>
      <App />
    </Suspense>
  </StrictMode>,
);
