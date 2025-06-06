import React from 'react';

interface AlertMessageProps {
  type: 'error' | 'success' | 'info';
  message: string;
  title?: string;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ type, message, title }) => {
  const baseClasses = 'p-4 rounded-md shadow';
  const typeClasses = {
    error: 'bg-red-100 border border-red-400 text-red-700',
    success: 'bg-green-100 border border-green-400 text-green-700',
    info: 'bg-blue-100 border border-blue-400 text-blue-700',
  };

  const Icon: React.FC<{ type: 'error' | 'success' | 'info'}> = ({ type }) => {
    if (type === 'error') return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>;
    if (type === 'success') return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>;
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]} flex items-start`} role="alert">
      <Icon type={type} />
      <div>
        {title && <h3 className="font-semibold">{title}</h3>}
        <p className="whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
};

export default AlertMessage;
