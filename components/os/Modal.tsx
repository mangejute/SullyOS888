
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    fullScreen?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, footer, fullScreen = false }) => {
    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center animate-fade-in ${fullScreen ? 'p-0' : 'p-6'}`}>
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className={`relative w-full bg-white shadow-2xl border border-white/20 overflow-hidden animate-slide-up ${fullScreen ? 'h-full max-w-none rounded-none flex flex-col' : 'max-w-sm rounded-[2.5rem]'}`}>
                <div className="px-6 pt-6 pb-2 relative">
                    <h3 className="text-lg font-bold text-slate-800 text-center">{title}</h3>
                    {fullScreen && <button type="button" onClick={onClose} aria-label="关闭" className="absolute right-5 top-5 h-8 w-8 rounded-full bg-slate-100 text-slate-500 text-xl leading-none">×</button>}
                </div>
                <div className={`px-6 py-4 overflow-y-auto no-scrollbar ${fullScreen ? 'flex-1 max-h-none' : 'max-h-[60vh]'}`}>
                    {children}
                </div>
                {footer ? (
                    <div className="px-6 pb-6 flex gap-3">
                        {footer}
                    </div>
                ) : (
                    <div className="px-6 pb-6">
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl active:scale-95 transition-transform"
                        >
                            关闭
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
