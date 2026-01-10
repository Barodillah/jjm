import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Calculator that doubles as a hidden PIN login
 * - Works as a real calculator
 * - If user enters exactly 4 digits + "=" it checks as PIN
 */
export default function PinLogin({ onSuccess }) {
    const [display, setDisplay] = useState('0');
    const [isLoading, setIsLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [previousValue, setPreviousValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    // Check if current display is a 4-digit PIN candidate
    const isPinCandidate = (value) => {
        return /^\d{4}$/.test(value);
    };

    // Handle number input
    const handleNumber = (num) => {
        if (isLoading) return;

        if (waitingForOperand) {
            setDisplay(num);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? num : display + num);
        }
    };

    // Handle operator input
    const handleOperator = (op) => {
        if (isLoading) return;

        const currentValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(currentValue);
        } else if (operator && !waitingForOperand) {
            const result = calculate(previousValue, currentValue, operator);
            setDisplay(String(result));
            setPreviousValue(result);
        }

        setOperator(op);
        setWaitingForOperand(true);
    };

    // Calculate result
    const calculate = (prev, current, op) => {
        switch (op) {
            case '+': return prev + current;
            case '-': return prev - current;
            case '×': return prev * current;
            case '÷': return current !== 0 ? prev / current : 'Error';
            default: return current;
        }
    };

    // Handle equals - either calculate or try PIN login
    const handleEquals = async () => {
        if (isLoading) return;

        // Check if it's a 4-digit PIN attempt
        if (isPinCandidate(display) && previousValue === null && operator === null) {
            await tryPinLogin(display);
            return;
        }

        // Otherwise, do normal calculation
        if (operator && previousValue !== null) {
            const currentValue = parseFloat(display);
            const result = calculate(previousValue, currentValue, operator);
            setDisplay(String(result));
            setPreviousValue(null);
            setOperator(null);
            setWaitingForOperand(true);
        }
    };

    // Try PIN login
    const tryPinLogin = async (pin) => {
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            const data = await res.json();

            if (data.success) {
                sessionStorage.setItem('jjm_auth', 'true');
                sessionStorage.setItem('jjm_pin', pin);
                onSuccess();
            } else {
                triggerShake();
                setDisplay('0');
            }
        } catch (err) {
            triggerShake();
            setDisplay('Error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle AC (All Clear)
    const handleClear = () => {
        setDisplay('0');
        setPreviousValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    // Handle decimal point
    const handleDecimal = () => {
        if (isLoading) return;

        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
            else if (e.key === '+') handleOperator('+');
            else if (e.key === '-') handleOperator('-');
            else if (e.key === '*') handleOperator('×');
            else if (e.key === '/') handleOperator('÷');
            else if (e.key === 'Enter' || e.key === '=') handleEquals();
            else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') handleClear();
            else if (e.key === '.') handleDecimal();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [display, previousValue, operator, waitingForOperand, isLoading]);

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-gray-100 flex items-center justify-center p-4 pt-safe-area pb-safe-area">
            {/* Calculator Card - Responsive sizing for Safari/iOS */}
            <div
                className={`bg-white rounded-[32px] shadow-2xl w-full p-6 transition-transform ${shake ? 'animate-shake' : ''}`}
                style={{
                    maxWidth: 'min(340px, calc(100vw - 32px))',
                    minWidth: '280px',
                }}
            >
                {/* Display */}
                <div className="text-right mb-8 min-h-[72px] flex items-end justify-end px-2">
                    <span
                        className="font-light text-gray-700 truncate"
                        style={{
                            fontSize: display.length > 10 ? 'clamp(1.5rem, 8vw, 2rem)'
                                : display.length > 7 ? 'clamp(2rem, 10vw, 2.5rem)'
                                    : 'clamp(2.5rem, 12vw, 3.5rem)'
                        }}
                    >
                        {isLoading ? '...' : display}
                    </span>
                </div>

                {/* Calculator Buttons */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {/* Row 1: Operators */}
                    {['+', '-', '×', '÷'].map((op) => (
                        <button
                            key={op}
                            onClick={() => handleOperator(op)}
                            disabled={isLoading}
                            className={`aspect-square rounded-full text-lg sm:text-xl font-medium transition-all active:scale-95 touch-manipulation ${operator === op && waitingForOperand
                                ? 'bg-gray-400 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 active:bg-gray-300'
                                }`}
                            style={{ minHeight: '52px' }}
                        >
                            {op}
                        </button>
                    ))}

                    {/* Row 2: 7, 8, 9 + = button start */}
                    {['7', '8', '9'].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumber(num)}
                            disabled={isLoading}
                            className="aspect-square rounded-full bg-gray-200 text-gray-700 text-lg sm:text-xl font-medium hover:bg-gray-300 active:bg-gray-300 transition-all active:scale-95 touch-manipulation"
                            style={{ minHeight: '52px' }}
                        >
                            {num}
                        </button>
                    ))}

                    {/* Equals button - spans 4 rows */}
                    <button
                        onClick={handleEquals}
                        disabled={isLoading}
                        className="row-span-4 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:bg-[#ff5252] text-white text-2xl sm:text-3xl font-medium transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center shadow-lg touch-manipulation"
                        style={{ minHeight: '52px' }}
                    >
                        {isLoading ? (
                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            '='
                        )}
                    </button>

                    {/* Row 3: 4, 5, 6 */}
                    {['4', '5', '6'].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumber(num)}
                            disabled={isLoading}
                            className="aspect-square rounded-full bg-gray-200 text-gray-700 text-lg sm:text-xl font-medium hover:bg-gray-300 active:bg-gray-300 transition-all active:scale-95 touch-manipulation"
                            style={{ minHeight: '52px' }}
                        >
                            {num}
                        </button>
                    ))}

                    {/* Row 4: 1, 2, 3 */}
                    {['1', '2', '3'].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumber(num)}
                            disabled={isLoading}
                            className="aspect-square rounded-full bg-gray-200 text-gray-700 text-lg sm:text-xl font-medium hover:bg-gray-300 active:bg-gray-300 transition-all active:scale-95 touch-manipulation"
                            style={{ minHeight: '52px' }}
                        >
                            {num}
                        </button>
                    ))}

                    {/* Row 5: 0, ., AC */}
                    <button
                        onClick={() => handleNumber('0')}
                        disabled={isLoading}
                        className="aspect-square rounded-full bg-gray-200 text-gray-700 text-lg sm:text-xl font-medium hover:bg-gray-300 active:bg-gray-300 transition-all active:scale-95 touch-manipulation"
                        style={{ minHeight: '52px' }}
                    >
                        0
                    </button>
                    <button
                        onClick={handleDecimal}
                        disabled={isLoading}
                        className="aspect-square rounded-full bg-gray-200 text-gray-700 text-lg sm:text-xl font-medium hover:bg-gray-300 active:bg-gray-300 transition-all active:scale-95 touch-manipulation"
                        style={{ minHeight: '52px' }}
                    >
                        .
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={isLoading}
                        className="aspect-square rounded-full bg-gray-200 text-gray-500 text-base sm:text-lg font-medium hover:bg-gray-300 active:bg-gray-300 transition-all active:scale-95 touch-manipulation"
                        style={{ minHeight: '52px' }}
                    >
                        AC
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                    20%, 40%, 60%, 80% { transform: translateX(8px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                /* iOS Safari touch optimization */
                button {
                    -webkit-tap-highlight-color: transparent;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                }
            `}</style>
        </div>,
        document.body
    );
}
