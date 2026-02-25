import { useState, useRef, useEffect, useCallback } from 'react';
import type { Board, ClueData } from '@answer-arena/shared';

interface Props {
  board: Board;
  roomCode: string;
  onRegenerate: () => void;
  onRegenerateCategory: (categoryIndex: number) => void;
  onBoardChange: (board: Board) => void;
  onNewBoard: () => void;
  loading: boolean;
}

function EditableText({
  value,
  onSave,
  multiline,
  labelStyle,
  textStyle,
}: {
  value: string;
  onSave: (val: string) => void;
  multiline?: boolean;
  labelStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      commit();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    const inputStyle: React.CSSProperties = {
      ...editStyles.input,
      ...(textStyle || {}),
    };
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' as const }}
          rows={3}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        style={inputStyle}
      />
    );
  }

  return (
    <p
      style={{ ...textStyle, cursor: 'pointer', ...editStyles.hoverHint }}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value || '(empty)'}
    </p>
  );
}

export function BoardPreview({
  board,
  roomCode,
  onRegenerate,
  onRegenerateCategory,
  onBoardChange,
  onNewBoard,
  loading,
}: Props) {
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateCategory = useCallback((catIndex: number, name: string) => {
    const updated = structuredClone(board);
    const cat = updated.categories[catIndex];
    if (!cat) return;
    cat.name = name;
    onBoardChange(updated);
    setDirty(true);
  }, [board, onBoardChange]);

  const updateClue = useCallback((catIndex: number, clueIndex: number, field: keyof ClueData, value: string | string[]) => {
    const updated = structuredClone(board);
    const cat = updated.categories[catIndex];
    if (!cat) return;
    const clue = cat.clues[clueIndex];
    if (!clue) return;
    if (field === 'acceptable') {
      clue.acceptable = value as string[];
    } else if (field === 'clue' || field === 'answer' || field === 'explanation') {
      (clue as any)[field] = value as string;
    }
    onBoardChange(updated);
    setDirty(true);
  }, [board, onBoardChange]);

  const saveBoard = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/board/${roomCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board }),
      });
      if (res.ok) {
        setDirty(false);
      }
    } catch (err) {
      console.error('Failed to save board:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Board Preview</h3>
        <div style={styles.headerActions}>
          {dirty && (
            <button
              style={styles.saveBtn}
              onClick={saveBoard}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <button
            style={styles.regenAllBtn}
            onClick={onRegenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Regenerate All'}
          </button>
          <button
            style={styles.newBoardBtn}
            onClick={onNewBoard}
            disabled={loading}
          >
            New Board
          </button>
        </div>
      </div>

      <p style={styles.editHint}>Tap any text to edit it directly.</p>

      {board.categories.map((cat, ci) => {
        const isExpanded = expandedCat === ci;
        return (
          <div key={ci} style={styles.category}>
            <div style={styles.catHeader}>
              <div
                style={styles.catNameWrap}
                onClick={(e) => e.stopPropagation()}
              >
                <EditableText
                  value={cat.name}
                  onSave={(val) => updateCategory(ci, val)}
                  textStyle={styles.catNameText}
                />
              </div>
              <button
                style={styles.catToggleBtn}
                onClick={() => setExpandedCat(isExpanded ? null : ci)}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            </div>

            {isExpanded && (
              <div style={styles.clueList}>
                {cat.clues.map((clue, cli) => (
                  <div key={cli} style={styles.clueCard}>
                    <div style={styles.clueHeader}>
                      <span style={styles.clueValue}>${clue.value}</span>
                    </div>
                    <div style={styles.clueBody}>
                      <p style={styles.clueLabel}>Clue:</p>
                      <EditableText
                        value={clue.clue}
                        onSave={(val) => updateClue(ci, cli, 'clue', val)}
                        multiline
                        textStyle={styles.clueText}
                      />
                      <p style={styles.answerLabel}>Answer:</p>
                      <EditableText
                        value={clue.answer}
                        onSave={(val) => updateClue(ci, cli, 'answer', val)}
                        textStyle={styles.answerText}
                      />
                      <p style={styles.acceptLabel}>Also accept:</p>
                      <EditableText
                        value={clue.acceptable.join(', ')}
                        onSave={(val) => updateClue(ci, cli, 'acceptable', val.split(',').map(s => s.trim()).filter(Boolean))}
                        textStyle={styles.acceptText}
                      />
                      <p style={styles.explainLabel}>Why:</p>
                      <EditableText
                        value={clue.explanation}
                        onSave={(val) => updateClue(ci, cli, 'explanation', val)}
                        multiline
                        textStyle={styles.explainText}
                      />
                    </div>
                  </div>
                ))}
                <button
                  style={styles.regenCatBtn}
                  onClick={() => onRegenerateCategory(ci)}
                  disabled={loading}
                >
                  Regenerate "{cat.name}"
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const editStyles: Record<string, React.CSSProperties> = {
  input: {
    width: '100%',
    fontSize: '14px',
    padding: '6px 8px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.12)',
    color: 'white',
    border: '1px solid var(--jeopardy-gold)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  hoverHint: {
    borderBottom: '1px dashed rgba(255,255,255,0.2)',
    paddingBottom: '1px',
  },
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  headerActions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  title: { fontSize: '20px', color: 'var(--jeopardy-gold)', margin: 0 },
  editHint: {
    fontSize: '12px',
    color: 'var(--text-light)',
    opacity: 0.5,
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  saveBtn: {
    fontSize: '13px',
    padding: '6px 14px',
    borderRadius: '8px',
    background: 'var(--correct-green)',
    color: 'white',
    fontWeight: 'bold',
  },
  regenAllBtn: {
    fontSize: '13px',
    padding: '6px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--text-light)',
  },
  newBoardBtn: {
    fontSize: '13px',
    padding: '6px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--text-light)',
  },
  category: {
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
  },
  catHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'var(--jeopardy-dark)',
  },
  catNameWrap: {
    flex: 1,
    minWidth: 0,
  },
  catNameText: {
    fontSize: '17px',
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
  },
  catToggleBtn: {
    fontSize: '12px',
    color: 'var(--jeopardy-gold)',
    marginLeft: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  clueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px',
  },
  clueCard: {
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  clueHeader: {
    padding: '8px 12px',
    background: 'var(--jeopardy-blue)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clueValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'var(--jeopardy-gold)',
  },
  clueBody: { padding: '10px 12px' },
  clueLabel: { fontSize: '11px', color: 'var(--text-light)', opacity: 0.7, margin: '0 0 2px 0' },
  clueText: { fontSize: '15px', color: 'white', margin: '0 0 10px 0', lineHeight: 1.4 },
  answerLabel: { fontSize: '11px', color: 'var(--correct-green)', opacity: 0.8, margin: '0 0 2px 0' },
  answerText: { fontSize: '15px', color: 'var(--correct-green)', fontWeight: 'bold', margin: '0 0 8px 0' },
  acceptLabel: { fontSize: '11px', color: 'var(--text-light)', opacity: 0.6, margin: '0 0 2px 0' },
  acceptText: { fontSize: '13px', color: 'var(--text-light)', opacity: 0.8, margin: '0 0 8px 0' },
  explainLabel: { fontSize: '11px', color: 'var(--text-light)', opacity: 0.6, margin: '0 0 2px 0' },
  explainText: { fontSize: '13px', color: 'var(--text-light)', opacity: 0.7, margin: 0, fontStyle: 'italic' },
  regenCatBtn: {
    fontSize: '14px',
    padding: '10px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-light)',
    marginTop: '4px',
  },
};
