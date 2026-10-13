import React, { useState } from 'react';
import { BirthdayContent, ReasonItem } from '../../types/content.types';
import { FileText, Plus, Trash2, Heart, Sparkles, Mail, Smile } from 'lucide-react';

interface AdminTextTabProps {
  content: BirthdayContent;
  onChange: (newContent: BirthdayContent) => void;
}

export const AdminTextTab: React.FC<AdminTextTabProps> = ({
  content,
  onChange,
}) => {
  const [activeSection, setActiveSection] = useState<
    'recipient' | 'greeting' | 'cake' | 'letter' | 'reasons' | 'finale'
  >('recipient');

  // Letter paragraph handlers
  const handleLetterParagraphChange = (index: number, text: string) => {
    const updated = [...content.loveLetter.paragraphs];
    updated[index] = text;
    onChange({
      ...content,
      loveLetter: { ...content.loveLetter, paragraphs: updated },
    });
  };

  const addLetterParagraph = () => {
    onChange({
      ...content,
      loveLetter: {
        ...content.loveLetter,
        paragraphs: [...content.loveLetter.paragraphs, 'New love letter paragraph...'],
      },
    });
  };

  const removeLetterParagraph = (index: number) => {
    if (content.loveLetter.paragraphs.length <= 1) return;
    const updated = content.loveLetter.paragraphs.filter((_, i) => i !== index);
    onChange({
      ...content,
      loveLetter: { ...content.loveLetter, paragraphs: updated },
    });
  };

  // Finale paragraph handlers
  const handleFinaleParagraphChange = (index: number, text: string) => {
    const updated = [...content.finale.paragraphs];
    updated[index] = text;
    onChange({
      ...content,
      finale: { ...content.finale, paragraphs: updated },
    });
  };

  const addFinaleParagraph = () => {
    onChange({
      ...content,
      finale: {
        ...content.finale,
        paragraphs: [...content.finale.paragraphs, 'Forever and always...'],
      },
    });
  };

  const removeFinaleParagraph = (index: number) => {
    if (content.finale.paragraphs.length <= 1) return;
    const updated = content.finale.paragraphs.filter((_, i) => i !== index);
    onChange({
      ...content,
      finale: { ...content.finale, paragraphs: updated },
    });
  };

  // Reasons handlers
  const updateReason = (id: number, updates: Partial<ReasonItem>) => {
    onChange({
      ...content,
      reasons: content.reasons.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    });
  };

  const addReason = () => {
    const nextId =
      content.reasons.length > 0 ? Math.max(...content.reasons.map((r) => r.id)) + 1 : 1;
    const icons = ['Heart', 'Sparkles', 'Smile', 'Moon', 'Star', 'Home'];
    const newReason: ReasonItem = {
      id: nextId,
      title: 'A Sweet New Reason 🌸',
      description: 'Describe this lovely reason why you cherish her...',
      iconName: icons[content.reasons.length % icons.length],
    };
    onChange({
      ...content,
      reasons: [...content.reasons, newReason],
    });
  };

  const removeReason = (id: number) => {
    if (content.reasons.length <= 1) {
      alert('Keep at least one reason in the list.');
      return;
    }
    onChange({
      ...content,
      reasons: content.reasons.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading text-neutral-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-CTA" />
          Story Copy & Text Editor
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Customize every message, name, letter paragraph, and reason why you love her.
        </p>
      </div>

      {/* Section Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSection('recipient')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSection === 'recipient'
              ? 'bg-rose-CTA text-white shadow-xs'
              : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
          }`}
        >
          Names & Date
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('greeting')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSection === 'greeting'
              ? 'bg-rose-CTA text-white shadow-xs'
              : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
          }`}
        >
          Ch.1 Greeting
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('cake')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSection === 'cake'
              ? 'bg-rose-CTA text-white shadow-xs'
              : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
          }`}
        >
          Ch.2 Cake & Wish
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('letter')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSection === 'letter'
              ? 'bg-rose-CTA text-white shadow-xs'
              : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
          }`}
        >
          Ch.3 Love Letter
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('reasons')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSection === 'reasons'
              ? 'bg-rose-CTA text-white shadow-xs'
              : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
          }`}
        >
          Ch.4 Reasons Why
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('finale')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSection === 'finale'
              ? 'bg-rose-CTA text-white shadow-xs'
              : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
          }`}
        >
          Ch.6 Finale
        </button>
      </div>

      {/* Tab 1: Names & Dates */}
      {activeSection === 'recipient' && (
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
          <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-CTA" />
            Couple Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={content.recipient.name}
                onChange={(e) =>
                  onChange({
                    ...content,
                    recipient: { ...content.recipient, name: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Nickname (Optional)
              </label>
              <input
                type="text"
                value={content.recipient.nickname}
                onChange={(e) =>
                  onChange({
                    ...content,
                    recipient: { ...content.recipient, nickname: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Birthday Date
              </label>
              <input
                type="date"
                value={content.recipient.birthDate}
                onChange={(e) =>
                  onChange({
                    ...content,
                    recipient: { ...content.recipient, birthDate: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Sender Name (Your Name)
              </label>
              <input
                type="text"
                value={content.sender.name}
                onChange={(e) =>
                  onChange({
                    ...content,
                    sender: { ...content.sender, name: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Chapter 1 Greeting */}
      {activeSection === 'greeting' && (
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
          <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-CTA" />
            Chapter 1: Opening Greeting Card
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Top Badge Text
              </label>
              <input
                type="text"
                value={content.greeting.badge}
                onChange={(e) =>
                  onChange({
                    ...content,
                    greeting: { ...content.greeting, badge: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Main Hero Headline
              </label>
              <input
                type="text"
                value={content.greeting.title}
                onChange={(e) =>
                  onChange({
                    ...content,
                    greeting: { ...content.greeting, title: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Invitation Message
              </label>
              <textarea
                rows={3}
                value={content.greeting.invitation}
                onChange={(e) =>
                  onChange({
                    ...content,
                    greeting: { ...content.greeting, invitation: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Start Button Text
                </label>
                <input
                  type="text"
                  value={content.greeting.ctaText}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      greeting: { ...content.greeting, ctaText: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Sound Notice Hint
                </label>
                <input
                  type="text"
                  value={content.greeting.audioHint}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      greeting: { ...content.greeting, audioHint: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Chapter 2 Cake & Wish */}
      {activeSection === 'cake' && (
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
          <h4 className="text-sm font-bold text-neutral-800">
            Chapter 2: Birthday Cake & Wish
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Celebration Headline
              </label>
              <input
                type="text"
                value={content.birthdayMoment.celebrationHeader}
                onChange={(e) =>
                  onChange({
                    ...content,
                    birthdayMoment: {
                      ...content.birthdayMoment,
                      celebrationHeader: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Pre-Blow Prompt (Instruction before tapping flame)
              </label>
              <input
                type="text"
                value={content.birthdayMoment.instructionPre}
                onChange={(e) =>
                  onChange({
                    ...content,
                    birthdayMoment: {
                      ...content.birthdayMoment,
                      instructionPre: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Post-Blow Message (After flame is extinguished)
              </label>
              <textarea
                rows={2}
                value={content.birthdayMoment.instructionPost}
                onChange={(e) =>
                  onChange({
                    ...content,
                    birthdayMoment: {
                      ...content.birthdayMoment,
                      instructionPost: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Button to Love Letter
              </label>
              <input
                type="text"
                value={content.birthdayMoment.ctaText}
                onChange={(e) =>
                  onChange({
                    ...content,
                    birthdayMoment: {
                      ...content.birthdayMoment,
                      ctaText: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Chapter 3 Love Letter */}
      {activeSection === 'letter' && (
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
          <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-rose-CTA" />
            Chapter 3: Handwritten Love Letter
          </h4>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Envelope Label
                </label>
                <input
                  type="text"
                  value={content.loveLetter.envelopeLabel}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      loveLetter: {
                        ...content.loveLetter,
                        envelopeLabel: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Wax Seal Hint
                </label>
                <input
                  type="text"
                  value={content.loveLetter.waxSealHint}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      loveLetter: {
                        ...content.loveLetter,
                        waxSealHint: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Salutation
              </label>
              <input
                type="text"
                value={content.loveLetter.salutation}
                onChange={(e) =>
                  onChange({
                    ...content,
                    loveLetter: {
                      ...content.loveLetter,
                      salutation: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800 font-bold"
              />
            </div>

            {/* Paragraphs List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700">
                  Letter Paragraphs ({content.loveLetter.paragraphs.length})
                </label>
                <button
                  type="button"
                  onClick={addLetterParagraph}
                  className="text-xs font-bold text-rose-CTA flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Paragraph
                </button>
              </div>

              {content.loveLetter.paragraphs.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-xs font-bold text-neutral-400 mt-2">
                    #{idx + 1}
                  </span>
                  <textarea
                    rows={3}
                    value={p}
                    onChange={(e) => handleLetterParagraphChange(idx, e.target.value)}
                    className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs text-neutral-800 leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => removeLetterParagraph(idx)}
                    className="p-1 text-stone-400 hover:text-red-500 mt-2"
                    title="Remove paragraph"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Sign-off
                </label>
                <input
                  type="text"
                  value={content.loveLetter.signOff}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      loveLetter: { ...content.loveLetter, signOff: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Signature
                </label>
                <input
                  type="text"
                  value={content.loveLetter.signature}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      loveLetter: { ...content.loveLetter, signature: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800 font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Chapter 4 Reasons Why */}
      {activeSection === 'reasons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
              <Smile className="w-4 h-4 text-rose-CTA" />
              Chapter 4: Reasons Why I Love You ({content.reasons.length} Cards)
            </h4>
            <button
              type="button"
              onClick={addReason}
              className="px-3.5 py-1.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reason Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.reasons.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                  <span className="text-xs font-bold text-neutral-400">
                    Reason #{item.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReason(item.id)}
                    className="text-stone-400 hover:text-red-500 p-1"
                    title="Delete reason"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">
                      Card Title
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateReason(item.id, { title: e.target.value })}
                      className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs font-bold text-neutral-800"
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">
                      Icon
                    </label>
                    <select
                      value={item.iconName}
                      onChange={(e) => updateReason(item.id, { iconName: e.target.value })}
                      className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
                    >
                      <option value="Heart">Heart ❤️</option>
                      <option value="Smile">Smile 😊</option>
                      <option value="Moon">Moon 🌙</option>
                      <option value="Sparkles">Sparkles ✨</option>
                      <option value="Star">Star ⭐</option>
                      <option value="Home">Home 🏡</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => updateReason(item.id, { description: e.target.value })}
                    className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Chapter 6 Finale */}
      {activeSection === 'finale' && (
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
          <h4 className="text-sm font-bold text-neutral-800">
            Chapter 6: Grand Finale Closing Screen
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Climax Romantic Headline
              </label>
              <input
                type="text"
                value={content.finale.title}
                onChange={(e) =>
                  onChange({
                    ...content,
                    finale: { ...content.finale, title: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-bold text-neutral-800"
              />
            </div>

            {/* Finale Paragraphs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700">
                  Closing Paragraphs ({content.finale.paragraphs.length})
                </label>
                <button
                  type="button"
                  onClick={addFinaleParagraph}
                  className="text-xs font-bold text-rose-CTA flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Paragraph
                </button>
              </div>

              {content.finale.paragraphs.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-xs font-bold text-neutral-400 mt-2">
                    #{idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    value={p}
                    onChange={(e) => handleFinaleParagraphChange(idx, e.target.value)}
                    className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs text-neutral-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeFinaleParagraph(idx)}
                    className="p-1 text-stone-400 hover:text-red-500 mt-2"
                    title="Remove paragraph"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Sign-off
                </label>
                <input
                  type="text"
                  value={content.finale.signOff}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      finale: { ...content.finale, signOff: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Replay Button Text
                </label>
                <input
                  type="text"
                  value={content.finale.replayText}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      finale: { ...content.finale, replayText: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
