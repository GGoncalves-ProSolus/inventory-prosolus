import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
            button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
            bg: "bg-red-50"
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
            button: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
            bg: "bg-orange-50"
        },
        info: {
            icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
            button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
            bg: "bg-blue-50"
        }
    };

    const currentVariant = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${currentVariant.bg} dark:bg-opacity-10`}>
                            {currentVariant.icon}
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {message}
                    </p>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentVariant.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
