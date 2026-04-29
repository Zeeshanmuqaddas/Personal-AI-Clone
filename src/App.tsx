import { useState, useRef, useEffect } from "react";
import { Send, User, Brain, Target, Database, Plus, Trash2, Bot, AlertCircle } from "lucide-react";
import { askClone, CloneResponse } from "./lib/gemini";
import { cn } from "./lib/utils";

type CoreMessage = {
  role: "user" | "model";
  parts: { text: string }[];
  isCloneResponse?: boolean;
  cloneData?: CloneResponse;
};

export default function App() {
  const [personality, setPersonality] = useState(
    "Calm, logical, business-minded.\\nAvoids risky decisions."
  );
  const [goals, setGoals] = useState("Wants financial independence.\\nFocuses on long-term growth over short-term gains.");
  const [memories, setMemories] = useState<string[]>([
    "Chose to invest in index funds rather than a hot crypto token in 2021.",
    "Declined a high-stress startup job for a stable corporate role with better work-life balance."
  ]);
  const [newMemory, setNewMemory] = useState("");

  const [chatHistory, setChatHistory] = useState<CoreMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleAddMemory = () => {
    if (newMemory.trim()) {
      setMemories([...memories, newMemory.trim()]);
      setNewMemory("");
    }
  };

  const handleDeleteMemory = (index: number) => {
    setMemories(memories.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    setIsTyping(true);

    const updatedHistory: CoreMessage[] = [
      ...chatHistory,
      { role: "user", parts: [{ text: userMsg }] }
    ];
    setChatHistory(updatedHistory);

    try {
      const response = await askClone(
        personality,
        goals,
        memories,
        // Send history without the extra UI fields to the API
        updatedHistory.map(h => ({ role: h.role, parts: h.parts })),
        userMsg
      );

      setChatHistory([
        ...updatedHistory,
        {
          role: "model",
          parts: [{ text: response.response_as_user }],
          isCloneResponse: true,
          cloneData: response
        }
      ]);
    } catch (error) {
      console.error("Failed to get clone response:", error);
      alert("Failed to communicate with your clone. Make sure the API key is set.");
      setChatHistory([
        ...updatedHistory,
        {
          role: "model",
          parts: [{ text: "Error connecting to AI brain." }],
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      {/* Left Sidebar: Personality Configuration */}
      <div className="w-1/3 min-w-[320px] max-w-sm border-r border-slate-200 bg-white flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Persona Config</h1>
            <p className="text-xs text-slate-500">Train your digital clone</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Personality Box */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-slate-700">
              <User size={16} className="mr-2 text-slate-400" />
              Personality Traits
            </label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400 min-h-[100px]"
              placeholder="e.g. Calm, logical, sarcastic, formal..."
            />
          </div>

          {/* Goals Box */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-slate-700">
              <Target size={16} className="mr-2 text-slate-400" />
              Goals & Motivations
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400 min-h-[100px]"
              placeholder="e.g. Wants financial independence, looking to start a family..."
            />
          </div>

          {/* Memories Box */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-semibold text-slate-700">
              <Database size={16} className="mr-2 text-slate-400" />
              Past Memories & Decisions
            </label>
            
            <div className="space-y-2">
              {memories.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                  <p className="text-xs text-slate-600 flex-1 leading-relaxed">{m}</p>
                  <button
                    onClick={() => handleDeleteMemory(idx)}
                    className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Memory"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                className="flex-1 text-sm p-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400"
                placeholder="Add a new decision or trait..."
              />
              <button
                onClick={handleAddMemory}
                disabled={!newMemory.trim()}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Right Main Area: Chat Interface */}
      <div className="flex-1 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white/95">
        {/* Header */}
        <div className="h-16 px-8 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-2 w-2 rounded-full absolute -top-1 -right-1 bg-green-500 ring-2 ring-white"></div>
              <Bot size={24} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Your AI Clone</h2>
              <p className="text-xs text-slate-500">Simulating your decisions based on injected persona</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <Brain size={48} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">The Clone is Ready</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-2">
                Ask a question to see how you might answer it based on your configured personality and memories.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col space-y-2 max-w-2xl",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm shadow-md"
                      : "bg-white border text-slate-800 border-slate-200 rounded-bl-sm shadow-sm"
                  )}
                >
                  {msg.parts[0].text}
                </div>

                {msg.isCloneResponse && msg.cloneData && (
                  <div className="w-full flex items-start space-x-4 bg-slate-50 border border-slate-200 p-4 rounded-xl mt-2 text-xs text-slate-600">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-700 flex items-center uppercase tracking-wider text-[10px]">
                          <Brain size={12} className="mr-1.5" />
                          Clone Reasoning
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full font-medium tracking-wide text-[10px] uppercase",
                            msg.cloneData.confidence === "high"
                              ? "bg-green-100 text-green-700"
                              : msg.cloneData.confidence === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {msg.cloneData.confidence} Confidence
                        </span>
                      </div>
                      <p className="leading-relaxed">{msg.cloneData.reasoning}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex space-x-2 mr-auto items-center text-slate-400 text-sm italic">
              <Bot size={16} />
              <span>Simulating decision architecture...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 p-6 flex flex-col justify-center shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl w-full mx-auto relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask me a question or propose a decision..."
              className="w-full py-4 pl-6 pr-14 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-700 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 transition-colors shadow-md"
            >
              <Send size={18} className={isTyping ? "animate-pulse" : ""} />
            </button>
          </div>
          <div className="text-center mt-3 text-[11px] text-slate-400 font-medium tracking-wide flex items-center justify-center space-x-1">
            <AlertCircle size={12}/> 
            <span>Decisions generated by clone are non-binding. Do not base actual life choices purely on simulated output.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
