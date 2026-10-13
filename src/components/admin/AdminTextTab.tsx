import React, { useState } from 'react';
import {
  BirthdayContent,
  ReasonItem,
  ChaosMuseumItem,
  BlessingItem,
  OpenWhenEnvelope,
  FutureDreamItem,
} from '../../types/content.types';
import { resolveMediaUrl } from '../../data/mediaRegistry';
import { MediaAssetPickerModal } from './MediaAssetPickerModal';
import {
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Mail,
  Crown,
  Compass,
} from 'lucide-react';

interface AdminTextTabProps {
  content: BirthdayContent;
  onChange: (newContent: BirthdayContent) => void;
}

export const AdminTextTab: React.FC<AdminTextTabProps> = ({
  content,
  onChange,
}) => {
  const [activeSection, setActiveSection] = useState<
    | 'recipient'
    | 'greeting'
    | 'cake'
    | 'letter'
    | 'reasons'
    | 'museum'
    | 'blessings'
    | 'openWhen'
    | 'future'
    | 'finale'
  >('recipient');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCallback, setPickerCallback] = useState<(url: string) => void>(() => () => {});
  const [pickerTitle, setPickerTitle] = useState('Select Photo');

  const openPhotoPicker = (title: string, onSelect: (url: string) => void) => {
    setPickerTitle(title);
    setPickerCallback(() => onSelect);
    setPickerOpen(true);
  };

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

  // Museum handlers
  const updateMuseumField = (field: string, value: string) => {
    if (!content.chaosMuseum) return;
    onChange({
      ...content,
      chaosMuseum: { ...content.chaosMuseum, [field]: value },
    });
  };

  const updateMuseumItem = (type: 'cute' | 'chaos', id: string, updates: Partial<ChaosMuseumItem>) => {
    if (!content.chaosMuseum) return;
    const listKey = type === 'cute' ? 'cuteItems' : 'chaosItems';
    onChange({
      ...content,
      chaosMuseum: {
        ...content.chaosMuseum,
        [listKey]: content.chaosMuseum[listKey].map((it) => (it.id === id ? { ...it, ...updates } : it)),
      },
    });
  };

  // Blessings handlers
  const updateBlessing = (id: number, updates: Partial<BlessingItem>) => {
    if (!content.blessings) return;
    onChange({
      ...content,
      blessings: {
        ...content.blessings,
        blessings: content.blessings.blessings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      },
    });
  };

  // Open When handlers
  const updateEnvelope = (id: number, updates: Partial<OpenWhenEnvelope>) => {
    if (!content.openWhen) return;
    onChange({
      ...content,
      openWhen: {
        ...content.openWhen,
        envelopes: content.openWhen.envelopes.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      },
    });
  };

  // Future Dreams handlers
  const updateFutureDream = (id: number, updates: Partial<FutureDreamItem>) => {
    if (!content.futureDreams) return;
    onChange({
      ...content,
      futureDreams: {
        ...content.futureDreams,
        dreams: content.futureDreams.dreams.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading text-neutral-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-CTA" />
          Story Copy & Chapter Content Editor
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Customize messages, letters, blessings, museum exhibits, open-when envelopes, and reasons.
        </p>
      </div>

      {/* Section Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-stone-200 pb-2">
        {[
          { id: 'recipient', label: 'Names & Date' },
          { id: 'greeting', label: 'Ch.1 Greeting' },
          { id: 'cake', label: 'Ch.2 Cake' },
          { id: 'letter', label: 'Ch.3 Letter' },
          { id: 'reasons', label: 'Ch.4 Reasons' },
          { id: 'museum', label: 'Ch.5 Museum' },
          { id: 'blessings', label: 'Ch.7 Blessings' },
          { id: 'openWhen', label: 'Ch.8 Open When' },
          { id: 'future', label: 'Ch.9 Future' },
          { id: 'finale', label: 'Ch.10 Finale' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === tab.id
                ? 'bg-rose-CTA text-white shadow-xs'
                : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: Recipient & Sender */}
      {activeSection === 'recipient' && (
        <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
          <h4 className="font-bold text-sm text-neutral-800">Couple & Birthday Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Birthday Girl Name</label>
              <input
                type="text"
                value={content.recipient.name}
                onChange={(e) =>
                  onChange({
                    ...content,
                    recipient: { ...content.recipient, name: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Nickname</label>
              <input
                type="text"
                value={content.recipient.nickname}
                onChange={(e) =>
                  onChange({
                    ...content,
                    recipient: { ...content.recipient, nickname: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Sender Name (Your Name)</label>
              <input
                type="text"
                value={content.sender.name}
                onChange={(e) =>
                  onChange({
                    ...content,
                    sender: { ...content.sender, name: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Birthday Date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={content.recipient.birthDate}
                onChange={(e) =>
                  onChange({
                    ...content,
                    recipient: { ...content.recipient, birthDate: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Greeting */}
      {activeSection === 'greeting' && (
        <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
          <h4 className="font-bold text-sm text-neutral-800">Chapter 1: Welcome Greeting</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Top Badge</label>
              <input
                type="text"
                value={content.greeting.badge}
                onChange={(e) =>
                  onChange({
                    ...content,
                    greeting: { ...content.greeting, badge: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Heading</label>
              <input
                type="text"
                value={content.greeting.title}
                onChange={(e) =>
                  onChange({
                    ...content,
                    greeting: { ...content.greeting, title: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Invitation Text</label>
              <textarea
                rows={3}
                value={content.greeting.invitation}
                onChange={(e) =>
                  onChange({
                    ...content,
                    greeting: { ...content.greeting, invitation: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Button CTA Text</label>
              <input
                type="text"
                value={content.greeting.ctaText}
                onChange={(e) =>
                  onChange({
                    ...content,
                    greeting: { ...content.greeting, ctaText: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Cake & Wish */}
      {activeSection === 'cake' && (
        <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
          <h4 className="font-bold text-sm text-neutral-800">Chapter 2: The Birthday Moment & Cake</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Celebration Heading</label>
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
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Instruction (Before Blow Out)</label>
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
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Wish Confirmation (After Blow Out)</label>
              <input
                type="text"
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
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Proceed CTA Button</label>
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
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Love Letter */}
      {activeSection === 'letter' && (
        <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-800">Chapter 3: Handwritten Love Letter</h4>
            <button
              type="button"
              onClick={addLetterParagraph}
              className="px-3 py-1 bg-rose-CTA text-white text-xs font-bold rounded-full hover:bg-rose-CTA-hover transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Paragraph</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Salutation</label>
              <input
                type="text"
                value={content.loveLetter.salutation}
                onChange={(e) =>
                  onChange({
                    ...content,
                    loveLetter: { ...content.loveLetter, salutation: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Sign-off Phrase</label>
              <input
                type="text"
                value={content.loveLetter.signOff}
                onChange={(e) =>
                  onChange({
                    ...content,
                    loveLetter: { ...content.loveLetter, signOff: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
          </div>

          {/* Letter Paragraphs */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-neutral-700">Paragraphs</label>
            {content.loveLetter.paragraphs.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-xs font-bold text-rose-CTA mt-2">#{idx + 1}</span>
                <textarea
                  rows={3}
                  value={p}
                  onChange={(e) => handleLetterParagraphChange(idx, e.target.value)}
                  className="flex-1 p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
                />
                <button
                  type="button"
                  onClick={() => removeLetterParagraph(idx)}
                  className="text-stone-400 hover:text-red-500 p-2 cursor-pointer"
                  title="Delete paragraph"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: Reasons Why */}
      {activeSection === 'reasons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-800">
              Chapter 4: Reasons Why I Love You ({content.reasons.length})
            </h4>
            <button
              type="button"
              onClick={addReason}
              className="px-3.5 py-1.5 rounded-full bg-rose-CTA text-white text-xs font-bold flex items-center gap-1.5 hover:bg-rose-CTA-hover transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reason</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.reasons.map((r) => (
              <div
                key={r.id}
                className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                  <span className="text-xs font-bold text-rose-CTA">Reason #{r.id}</span>
                  <button
                    type="button"
                    onClick={() => removeReason(r.id)}
                    className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                    title="Delete reason"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">Title</label>
                  <input
                    type="text"
                    value={r.title}
                    onChange={(e) => updateReason(r.id, { title: e.target.value })}
                    className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs font-bold text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">Description</label>
                  <textarea
                    rows={2}
                    value={r.description}
                    onChange={(e) => updateReason(r.id, { description: e.target.value })}
                    className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800 resize-none"
                  />
                </div>

                {/* Photo Pairing */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    {r.photoUrl ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200">
                        <img
                          src={resolveMediaUrl(r.photoUrl)}
                          alt={r.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 italic">No photo attached</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openPhotoPicker(`Select Photo for Reason #${r.id}`, (url) =>
                        updateReason(r.id, { photoUrl: url })
                      )
                    }
                    className="text-xs font-bold text-rose-CTA hover:underline cursor-pointer"
                  >
                    {r.photoUrl ? 'Change Photo 📷' : '+ Attach Photo 📷'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: Cute vs Chaos Museum */}
      {activeSection === 'museum' && content.chaosMuseum && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
              <Crown className="w-4 h-4 text-rose-CTA" />
              Chapter 5: Cute vs. Chaos Museum
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Badge</label>
                <input
                  type="text"
                  value={content.chaosMuseum.badge}
                  onChange={(e) => updateMuseumField('badge', e.target.value)}
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={content.chaosMuseum.title}
                  onChange={(e) => updateMuseumField('title', e.target.value)}
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={content.chaosMuseum.subtitle}
                onChange={(e) => updateMuseumField('subtitle', e.target.value)}
                className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
              />
            </div>
          </div>

          {/* Pretty Girl Exhibits */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
            <h5 className="font-bold text-xs text-rose-CTA uppercase tracking-wider">
              My Pretty Girl Exhibits ({content.chaosMuseum.cuteItems.length})
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {content.chaosMuseum.cuteItems.map((item) => (
                <div key={item.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                    <img
                      src={resolveMediaUrl(item.imageUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateMuseumItem('cute', item.id, { title: e.target.value })}
                      className="w-full p-1 bg-white border border-stone-300 rounded text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => updateMuseumItem('cute', item.id, { caption: e.target.value })}
                      className="w-full p-1 bg-white border border-stone-300 rounded text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        openPhotoPicker(`Select Photo for "${item.title}"`, (url) =>
                          updateMuseumItem('cute', item.id, { imageUrl: url })
                        )
                      }
                      className="text-[10px] font-bold text-rose-CTA hover:underline cursor-pointer"
                    >
                      Change Photo 📷
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Little Menace Exhibits */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
            <h5 className="font-bold text-xs text-lavender-700 uppercase tracking-wider">
              Little Menace Exhibits ({content.chaosMuseum.chaosItems.length})
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {content.chaosMuseum.chaosItems.map((item) => (
                <div key={item.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                    <img
                      src={resolveMediaUrl(item.imageUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateMuseumItem('chaos', item.id, { title: e.target.value })}
                      className="w-full p-1 bg-white border border-stone-300 rounded text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => updateMuseumItem('chaos', item.id, { caption: e.target.value })}
                      className="w-full p-1 bg-white border border-stone-300 rounded text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        openPhotoPicker(`Select Photo for "${item.title}"`, (url) =>
                          updateMuseumItem('chaos', item.id, { imageUrl: url })
                        )
                      }
                      className="text-[10px] font-bold text-lavender-700 hover:underline cursor-pointer"
                    >
                      Change Photo 📷
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: Birthday Blessings */}
      {activeSection === 'blessings' && content.blessings && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Chapter 7: Birthday Blessings
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Badge</label>
                <input
                  type="text"
                  value={content.blessings.badge}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      blessings: { ...content.blessings!, badge: e.target.value },
                    })
                  }
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={content.blessings.title}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      blessings: { ...content.blessings!, title: e.target.value },
                    })
                  }
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={content.blessings.subtitle}
                onChange={(e) =>
                  onChange({
                    ...content,
                    blessings: { ...content.blessings!, subtitle: e.target.value },
                  })
                }
                className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {content.blessings.blessings.map((b) => (
              <div key={b.id} className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-CTA">Blessing #{b.id}</span>
                </div>
                <input
                  type="text"
                  value={b.title}
                  onChange={(e) => updateBlessing(b.id, { title: e.target.value })}
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs font-bold"
                />
                <textarea
                  rows={2}
                  value={b.blessing}
                  onChange={(e) => updateBlessing(b.id, { blessing: e.target.value })}
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800 resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 8: Open When Envelopes */}
      {activeSection === 'openWhen' && content.openWhen && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-CTA" />
              Chapter 8: Open When... Envelopes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Badge</label>
                <input
                  type="text"
                  value={content.openWhen.badge}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      openWhen: { ...content.openWhen!, badge: e.target.value },
                    })
                  }
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={content.openWhen.title}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      openWhen: { ...content.openWhen!, title: e.target.value },
                    })
                  }
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.openWhen.envelopes.map((env) => (
              <div key={env.id} className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-rose-CTA">Envelope #{env.id}</span>
                <input
                  type="text"
                  value={env.title}
                  onChange={(e) => updateEnvelope(env.id, { title: e.target.value })}
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs font-bold"
                />
                <input
                  type="text"
                  value={env.preview}
                  onChange={(e) => updateEnvelope(env.id, { preview: e.target.value })}
                  placeholder="Preview text..."
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
                <textarea
                  rows={3}
                  value={env.message}
                  onChange={(e) => updateEnvelope(env.id, { message: e.target.value })}
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
                />
                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  {env.photoUrl && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200">
                      <img
                        src={resolveMediaUrl(env.photoUrl)}
                        alt={env.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      openPhotoPicker(`Select Photo for "${env.title}"`, (url) =>
                        updateEnvelope(env.id, { photoUrl: url })
                      )
                    }
                    className="text-xs font-bold text-rose-CTA hover:underline cursor-pointer"
                  >
                    {env.photoUrl ? 'Change Photo 📷' : '+ Attach Photo 📷'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 9: Future Dreams */}
      {activeSection === 'future' && content.futureDreams && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-CTA" />
              Chapter 9: A Little Future With You
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Badge</label>
                <input
                  type="text"
                  value={content.futureDreams.badge}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      futureDreams: { ...content.futureDreams!, badge: e.target.value },
                    })
                  }
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={content.futureDreams.title}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      futureDreams: { ...content.futureDreams!, title: e.target.value },
                    })
                  }
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Concluding Note</label>
              <input
                type="text"
                value={content.futureDreams.note}
                onChange={(e) =>
                  onChange({
                    ...content,
                    futureDreams: { ...content.futureDreams!, note: e.target.value },
                  })
                }
                className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {content.futureDreams.dreams.map((d) => (
              <div key={d.id} className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-rose-CTA">Dream #{d.id}</span>
                <input
                  type="text"
                  value={d.title}
                  onChange={(e) => updateFutureDream(d.id, { title: e.target.value })}
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs font-bold"
                />
                <textarea
                  rows={2}
                  value={d.description}
                  onChange={(e) => updateFutureDream(d.id, { description: e.target.value })}
                  className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800 resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 10: Finale */}
      {activeSection === 'finale' && (
        <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-800">Chapter 10: Grand Finale</h4>
            <button
              type="button"
              onClick={addFinaleParagraph}
              className="px-3 py-1 bg-rose-CTA text-white text-xs font-bold rounded-full hover:bg-rose-CTA-hover transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Paragraph</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Finale Headline</label>
              <input
                type="text"
                value={content.finale.title}
                onChange={(e) =>
                  onChange({
                    ...content,
                    finale: { ...content.finale, title: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Sign-off</label>
              <input
                type="text"
                value={content.finale.signOff}
                onChange={(e) =>
                  onChange({
                    ...content,
                    finale: { ...content.finale, signOff: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Replay Button Text</label>
              <input
                type="text"
                value={content.finale.replayText}
                onChange={(e) =>
                  onChange({
                    ...content,
                    finale: { ...content.finale, replayText: e.target.value },
                  })
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
              />
            </div>

            {/* Paragraphs */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-neutral-700">Paragraphs</label>
              {content.finale.paragraphs.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-xs font-bold text-rose-CTA mt-2">#{idx + 1}</span>
                  <textarea
                    rows={2}
                    value={p}
                    onChange={(e) => handleFinaleParagraphChange(idx, e.target.value)}
                    className="flex-1 p-2 bg-stone-50 border border-stone-300 rounded text-xs text-neutral-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeFinaleParagraph(idx)}
                    className="text-stone-400 hover:text-red-500 p-2 cursor-pointer"
                    title="Delete paragraph"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Photo Picker Modal */}
      <MediaAssetPickerModal
        isOpen={pickerOpen}
        title={pickerTitle}
        onSelect={pickerCallback}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
};
