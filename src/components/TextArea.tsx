import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCharCount?: boolean;
  minChars?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  showCharCount = false,
  // 根据环境设置默认的最小字数：开发环境5字，生产环境20字
  minChars = import.meta.env.DEV ? 5 : 20,
  value,
  className = '',
  ...props
}) => {
  const charCount = typeof value === 'string' ? value.length : 0;
  const remaining = Math.max(0, minChars - charCount);
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-body-small text-neutral-earth mb-8">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          value={value}
          className={`
            w-full min-h-[120px] max-h-[240px] px-16 py-16 
            bg-neutral-white rounded-lg 
            border-2 ${error ? 'border-semantic-error' : 'border-neutral-mist'}
            text-body text-neutral-dark 
            placeholder:text-neutral-stone placeholder:italic
            shadow-inner
            focus:outline-none focus:border-primary-500 focus:shadow-md
            transition-all duration-normal
            resize-none
            ${className}
          `}
          {...props}
        />
        {showCharCount && (
          <div className="absolute bottom-12 right-12 text-caption text-neutral-stone">
            {remaining > 0 ? (
              <span className="text-accent-sunrise">还差{remaining}字</span>
            ) : (
              <span>{charCount}字</span>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-4 text-body-small text-semantic-error">{error}</p>
      )}
    </div>
  );
};
