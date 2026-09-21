import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Phone, Video, Info, ChevronLeft, Search, CheckCheck } from 'lucide-react';
import { Conversation, Message, User } from '../types';

interface DirectMessagesViewProps {
  currentUser: User;
  conversations: Conversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  activeConversationId?: string;
}

export const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  currentUser,
  conversations,
  onSendMessage,
  activeConversationId,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    activeConversationId || conversations[0]?.id || ''
  );
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedId) return;

    onSendMessage(selectedId, inputText.trim());
    setInputText('');
  };

  const handleSelectConv = (id: string) => {
    setSelectedId(id);
    setShowMobileChat(true);
  };

  const filteredConversations = conversations.filter((c) =>
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="direct-messages-view"
      className="w-full max-w-5xl mx-auto h-[calc(100vh-120px)] md:h-[calc(100vh-60px)] md:my-4 bg-white dark:bg-black md:border border-neutral-200 dark:border-neutral-800 md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm"
    >
      {/* Conversations List Sidebar (visible on mobile when no chat active, always visible on desktop) */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-neutral-200 dark:border-neutral-800 ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header with Username */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-neutral-900 dark:text-white">
              {currentUser.username}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
              DMs
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 rounded-xl px-3 py-1.5 border border-neutral-200 dark:border-neutral-800">
            <Search className="w-4 h-4 text-neutral-400 mr-2" />
            <input
              id="dm-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Notes horizontal bubble row */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt="Your note"
                className="w-12 h-12 rounded-full object-cover"
              />
              <span className="absolute -top-1.5 -right-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                Share note
              </span>
            </div>
            <span className="text-[11px] text-neutral-500">Your note</span>
          </div>
          {conversations.slice(0, 3).map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelectConv(c.id)}
              className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <div className="relative">
                <img
                  src={c.user.avatar}
                  alt={c.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span className="absolute -top-1.5 -right-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] px-2 py-0.5 rounded-full shadow-xs font-medium truncate max-w-[70px]">
                  {(c.user as any).bio || '👋 Active'}
                </span>
              </div>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate max-w-[65px]">
                {c.user.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Messages
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center my-6">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                {searchQuery ? 'No chats found' : 'No messages yet'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[200px] mx-auto leading-relaxed">
                {searchQuery
                  ? 'Try searching for a different name or handle.'
                  : 'Your direct messages and conversations will appear here.'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedId;
              const lastMessage = conv.messages[conv.messages.length - 1];

              return (
                <button
                  key={conv.id}
                  id={`dm-conv-${conv.id}`}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`w-full flex items-center gap-3 p-3.5 text-left transition ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-900'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.user.avatar}
                      alt={conv.user.username}
                      className="w-13 h-13 rounded-full object-cover"
                    />
                    {conv.user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-black" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                        {conv.user.username}
                      </span>
                      {lastMessage && (
                        <span className="text-[11px] text-neutral-400 flex-shrink-0">
                          {lastMessage.timestamp}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs truncate ${
                        conv.unreadCount > 0
                          ? 'font-bold text-neutral-900 dark:text-white'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {lastMessage ? (
                        <>
                          {lastMessage.isMine && 'You: '}
                          {lastMessage.text}
                        </>
                      ) : (
                        'Started a conversation'
                      )}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Chat Window (visible on mobile if chat active, always visible on desktop) */}
      <div
        className={`flex-1 flex flex-col bg-white dark:bg-black ${
          !showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  id="dm-back-btn"
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  aria-label="Back to messages list"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="relative">
                  <img
                    src={selectedConv.user.avatar}
                    alt={selectedConv.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedConv.user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-black" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {selectedConv.user.name}
                  </h3>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {selectedConv.user.isOnline ? 'Active now' : 'Active 2h ago'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                <button
                  aria-label="Phone call"
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  aria-label="Video call"
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
                >
                  <Video className="w-5 h-5" />
                </button>
                <button
                  aria-label="Conversation info"
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* Profile Intro Card */}
              <div className="flex flex-col items-center text-center my-6">
                <img
                  src={selectedConv.user.avatar}
                  alt={selectedConv.user.name}
                  className="w-20 h-20 rounded-full object-cover mb-2 border border-neutral-200 dark:border-neutral-800"
                />
                <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                  {selectedConv.user.name}
                </h4>
                <p className="text-xs text-neutral-500">@{selectedConv.user.username} • Jhalak</p>
              </div>

              {/* Messages */}
              {selectedConv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[75%] ${
                    msg.isMine ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.isMine
                        ? 'bg-sky-500 text-white rounded-br-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-neutral-400 px-1">
                    <span>{msg.timestamp}</span>
                    {msg.isMine && <CheckCheck className="w-3 h-3 text-sky-400" />}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
            >
              <button
                type="button"
                aria-label="Add photo"
                onClick={() => setInputText((p) => p + ' 📸')}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 p-1.5 rounded-full"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Add emoji"
                onClick={() => setInputText((p) => p + ' 😊')}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 p-1.5 rounded-full"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                id="dm-message-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-full px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />

              <button
                id="dm-send-btn"
                type="submit"
                disabled={!inputText.trim()}
                className="bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white p-2.5 rounded-full transition shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500">
            <div className="w-20 h-20 rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center mb-3">
              <Send className="w-9 h-9 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              Your Messages
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Send private photos and messages to a friend or group.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
