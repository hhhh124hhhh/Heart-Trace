import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '../contexts/AnimationContext';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
  cursorChar?: string;
}

// 打字机文字组件
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  delay = 0,
  className = '',
  onComplete,
  showCursor = true,
  cursorChar = '|',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCursorState, setShowCursorState] = useState(true);
  const { shouldAnimate, getDuration } = useAnimation();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let typingInterval: NodeJS.Timeout;

    const startTyping = () => {
      setIsTyping(true);
      let currentIndex = 0;

      typingInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(prev => prev + text[currentIndex]);
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
          onComplete?.();
        }
      }, getDuration(speed));
    };

    if (shouldAnimate()) {
      timeout = setTimeout(startTyping, getDuration(delay));
    } else {
      setDisplayedText(text);
      onComplete?.();
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(typingInterval);
    };
  }, [text, speed, delay, shouldAnimate, getDuration, onComplete]);

  // 光标闪烁效果
  useEffect(() => {
    if (!showCursor || !isTyping) return;

    const cursorInterval = setInterval(() => {
      setShowCursorState(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [showCursor, isTyping]);

  return (
    <span className={className}>
      {displayedText}
      <AnimatePresence>
        {showCursor && isTyping && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: showCursorState ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="inline-block ml-1 text-blue-500"
          >
            {cursorChar}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

// 逐行显示文本组件
interface LineByLineTextProps {
  lines: string[];
  lineDelay?: number;
  speed?: number;
  className?: string;
  onLineComplete?: (lineIndex: number) => void;
  onComplete?: () => void;
}

export const LineByLineText: React.FC<LineByLineTextProps> = ({
  lines,
  lineDelay = 800,
  speed = 40,
  className = '',
  onLineComplete,
  onComplete,
}) => {
  const [completedLines, setCompletedLines] = useState<number[]>([]);
  const { shouldAnimate, getDuration } = useAnimation();

  useEffect(() => {
    if (completedLines.length === lines.length) {
      onComplete?.();
    }
  }, [completedLines.length, lines.length, onComplete]);

  const handleLineComplete = (lineIndex: number) => {
    setCompletedLines(prev => [...prev, lineIndex]);
    onLineComplete?.(lineIndex);
  };

  return (
    <div className={className}>
      {lines.map((line, index) => (
        <div key={index} className="min-h-[1.2em]">
          {shouldAnimate() ? (
            <TypewriterText
              text={line}
              speed={speed}
              delay={index * lineDelay}
              onComplete={() => handleLineComplete(index)}
              showCursor={index === completedLines.length}
            />
          ) : (
            <span>{line}</span>
          )}
        </div>
      ))}
    </div>
  );
};

// 逐词高亮显示组件
interface WordByWordHighlightProps {
  text: string;
  highlightWords?: string[];
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const WordByWordHighlight: React.FC<WordByWordHighlightProps> = ({
  text,
  highlightWords = [],
  speed = 200,
  className = '',
  onComplete,
}) => {
  const [visibleWords, setVisibleWords] = useState<number[]>([]);
  const words = text.split(' ');
  const { shouldAnimate, getDuration } = useAnimation();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const revealWords = () => {
      words.forEach((_, index) => {
        timeout = setTimeout(() => {
          setVisibleWords(prev => [...prev, index]);
          
          if (index === words.length - 1) {
            onComplete?.();
          }
        }, index * getDuration(speed));
      });
    };

    if (shouldAnimate()) {
      revealWords();
    } else {
      setVisibleWords(words.map((_, index) => index));
      onComplete?.();
    }

    return () => clearTimeout(timeout);
  }, [words, speed, shouldAnimate, getDuration, onComplete]);

  return (
    <div className={className}>
      {words.map((word, index) => {
        const isHighlighted = highlightWords.some(hw => 
          word.toLowerCase().includes(hw.toLowerCase())
        );
        const isVisible = visibleWords.includes(index);

        return (
          <motion.span
            key={index}
            className="inline-block mr-2"
            initial={shouldAnimate() ? { 
              opacity: 0, 
              y: 20,
              scale: 0.8,
            } : false}
            animate={shouldAnimate() && isVisible ? {
              opacity: 1,
              y: 0,
              scale: isHighlighted ? 1.1 : 1,
              color: isHighlighted ? '#3B82F6' : '#374151',
            } : undefined}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
};

// 渐进式显示组件
interface ProgressiveRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

export const ProgressiveReveal: React.FC<ProgressiveRevealProps> = ({
  children,
  delay = 0,
  duration = 1000,
  className = '',
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { shouldAnimate, getDuration } = useAnimation();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
      
      setTimeout(() => {
        onComplete?.();
      }, getDuration(duration));
    }, getDuration(delay));

    return () => clearTimeout(timeout);
  }, [delay, duration, getDuration, onComplete]);

  if (!shouldAnimate()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: getDuration(duration / 1000) }}
    >
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: isVisible ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
        transition={{
          duration: getDuration(duration / 1000),
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// AI回复专用打字机效果
interface AIResponseTextProps {
  response: string;
  onComplete?: () => void;
  className?: string;
}

export const AIResponseText: React.FC<AIResponseTextProps> = ({
  response,
  onComplete,
  className = '',
}) => {
  const [isComplete, setIsComplete] = useState(false);
  const { shouldAnimate } = useAnimation();

  const handleComplete = () => {
    setIsComplete(true);
    onComplete?.();
  };

  // 将回复分段，每段用不同的显示效果
  const sentences = response.match(/[^。！？.!?]+[。！？.!?]+/g) || [response];

  if (!shouldAnimate()) {
    return <div className={className}>{response}</div>;
  }

  return (
    <div className={className}>
      {sentences.map((sentence, index) => (
        <motion.div
          key={index}
          className="mb-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: index * 0.3,
            duration: 0.5,
          }}
        >
          <TypewriterText
            text={sentence.trim()}
            speed={30}
            delay={index * 800}
            showCursor={index === sentences.length - 1 && !isComplete}
            onComplete={index === sentences.length - 1 ? handleComplete : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
};