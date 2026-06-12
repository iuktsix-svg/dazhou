import { motion } from 'framer-motion';

interface Props {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
  showContinue?: boolean;
}

export function OptionList({ options, onSelect, disabled, showContinue }: Props) {
  if (options.length === 0 && !showContinue) return null;

  return (
    <div className="option-list">
      {options.map((opt, i) => (
        <motion.button
          key={i}
          className="option-btn"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          whileHover={{ x: 6 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(opt)}
          disabled={disabled}
        >
          {opt}
        </motion.button>
      ))}
      {showContinue && options.length === 0 && (
        <motion.button
          className="option-btn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onSelect('（继续）')}
          disabled={disabled}
          style={{ textAlign: 'center', color: 'var(--gold)', fontStyle: 'italic' }}
        >
          继续前行…
        </motion.button>
      )}
    </div>
  );
}
