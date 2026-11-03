import React, { useState } from 'react';
import { CollectionCentre, Collector, Sample, SystemSettings, UserProfile } from '../../types';
import { formatWhatsAppMessage, getWhatsAppClickToChatUrl } from '../../services/whatsappService';
import {
  MessageSquare,
  Send,
  Phone,
  CheckCircle2,
  Globe,
  ExternalLink,
  Copy,
  Clock,
  Sparkles,
  Building2,
  Truck,
  User,
} from 'lucide-react';

interface WhatsAppModuleProps {
  samples: Sample[];
  centres: CollectionCentre[];
  collectors: Collector[];
  settings: SystemSettings;
  currentUser: UserProfile;
}

export const WhatsAppModule: React.FC<WhatsAppModuleProps> = ({
  samples,
  centres,
  collectors,
  settings,
  currentUser,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'EN' | 'BN'>('EN');
  const [selectedSampleId, setSelectedSampleId] = useState<string>(samples[0]?.id || '');
  const [recipientType, setRecipientType] = useState<'PATIENT' | 'CENTRE' | 'COLLECTOR'>('PATIENT');
  const [customPhone, setCustomPhone] = useState('');
  const [customRecipientName, setCustomRecipientName] = useState('');
  const [dispatchedHistory, setDispatchedHistory] = useState<
    {
      id: string;
      to: string;
      phone: string;
      preview: string;
      timestamp: string;
      type: string;
    }[]
  >([]);
  const [isCopied, setIsCopied] = useState(false);

  const activeSample = samples.find((s) => s.id === selectedSampleId) || samples[0];

  // Pick target recipient phone and name
  let targetPhone = customPhone;
  let targetName = customRecipientName;

  if (activeSample) {
    if (recipientType === 'PATIENT') {
      targetPhone = activeSample.patientMobile || '+91 98302 91823';
      targetName = activeSample.patientName;
    } else if (recipientType === 'CENTRE') {
      const centre = centres.find((c) => c.id === activeSample.centreId);
      targetPhone = centre?.whatsappNumber || centre?.mobileNumber || '+91 98311 22334';
      targetName = centre?.contactPerson || centre?.name || 'Centre Operator';
    } else if (recipientType === 'COLLECTOR') {
      const col = collectors.find((c) => c.name === activeSample.collectorName);
      targetPhone = col?.whatsappNumber || col?.mobileNumber || '+91 98301 77889';
      targetName = col?.name || 'Field Collector';
    }
  }

  const templateToUse =
    selectedLanguage === 'BN'
      ? settings.whatsappBengaliTemplate
      : settings.whatsappEnglishTemplate;

  const renderedMessage = activeSample
    ? formatWhatsAppMessage(templateToUse, activeSample, settings, targetName)
    : 'No sample selected.';

  const handleLaunchWhatsApp = () => {
    const url = getWhatsAppClickToChatUrl(targetPhone, renderedMessage);
    window.open(url, '_blank');

    setDispatchedHistory((prev) => [
      {
        id: `wa-${Date.now()}`,
        to: targetName,
        phone: targetPhone,
        preview: renderedMessage.slice(0, 70) + '...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: recipientType,
      },
      ...prev,
    ]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              WhatsApp Logistics Notification Gateway
            </h2>
            <p className="text-xs text-slate-500">
              Automated Click-to-Chat dispatches with bilingual English & Bengali (বাংলা) diagnostic templates
            </p>
          </div>
        </div>

        {/* Language Pill Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setSelectedLanguage('EN')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedLanguage === 'EN'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            English
          </button>
          <button
            onClick={() => setSelectedLanguage('BN')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedLanguage === 'BN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            বাংলা (Bengali)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Sample & Recipient Selector (6 cols) */}
        <div className="space-y-4 lg:col-span-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Configure Notification Target</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700">Select Active Sample</label>
              <select
                value={selectedSampleId}
                onChange={(e) => setSelectedSampleId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-hidden"
              >
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sampleId} • {s.patientName} ({s.testName}) [{s.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Recipient Persona</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRecipientType('PATIENT')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 transition ${
                    recipientType === 'PATIENT'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <User className="h-4 w-4" /> Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('CENTRE')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 transition ${
                    recipientType === 'CENTRE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="h-4 w-4" /> Centre Hub
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('COLLECTOR')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 transition ${
                    recipientType === 'COLLECTOR'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="h-4 w-4" /> Runner
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Recipient Name</label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setCustomRecipientName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">WhatsApp Phone Number</label>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Quick Directory Directory */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Instant Centre WhatsApp Direct Contacts
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {centres.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs border border-slate-100"
                >
                  <div>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <div className="text-[10px] text-slate-400">
                      {c.contactPerson} • {c.whatsappNumber}
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${c.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                  >
                    Chat <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Message Preview (6 cols) */}
        <div className="space-y-4 lg:col-span-6">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-950 to-slate-950 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold">
                  WA
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400">WhatsApp Message Bubble</div>
                  <div className="text-[10px] text-slate-400">
                    To: {targetName} ({targetPhone})
                  </div>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg bg-emerald-900/80 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-800"
              >
                <Copy className="h-3.5 w-3.5" />
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Bubble UI */}
            <div className="my-4 rounded-xl bg-emerald-900/40 p-4 border border-emerald-700/40 text-xs font-mono leading-relaxed whitespace-pre-wrap text-emerald-100">
              {renderedMessage}
            </div>

            <button
              onClick={handleLaunchWhatsApp}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg transition active:scale-95"
            >
              <Send className="h-4 w-4" />
              Launch WhatsApp (Click-to-Chat)
            </button>
          </div>

          {/* Message History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Today's Dispatch History
              </h4>
              <span className="text-[11px] text-slate-400">{dispatchedHistory.length} sent</span>
            </div>

            {dispatchedHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No WhatsApp notifications sent yet in this session.
              </p>
            ) : (
              <div className="space-y-2">
                {dispatchedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs border border-slate-100"
                  >
                    <div>
                      <div className="font-bold text-slate-800">
                        {item.to} ({item.phone})
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">
                        {item.preview}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
