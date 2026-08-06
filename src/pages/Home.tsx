import React, { useState } from "react";
import { ToastNotification } from "../components/ToastNotification";
import { HeaderBar } from "../components/HeaderBar";
import { Footer } from "../components/Footer";
import { HeroBanner } from "../components/HeroBanner";
import { JoinRoomForm } from "../components/JoinRoomForm";
import { TrustBadges } from "../components/TrustBadges";
import { MeetingCardMockup } from "../components/MeetingCardMockup";
import { FeatureHighlights } from "../components/FeatureHighlights";
import { httpService } from "../services/httpService";
import { useNavigate } from "react-router";

export default function Home() {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const navigate = useNavigate();

  const generateRoomId = async () => {
    setIsGenerating(true);
    setErrorMsg("");
    try {
      const response = await fetch(`${httpService.joinRoom}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.roomId) {
        setRoomId(data.roomId);
        try {
          await navigator.clipboard.writeText(data.roomId);
          setCopiedNotification(true);
          setTimeout(() => setCopiedNotification(false), 3000);
        } catch {
          // Ignore clipboard permission errors
        }
      } else {
        throw new Error("No room ID received from server.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to fetch Room ID from server.";
      setErrorMsg(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your email address to join.");
      return;
    }
    if (!roomId.trim()) {
      setErrorMsg("Please enter or generate a Room ID.");
      return;
    }
    setErrorMsg("");

    // Pass the email in the route state so RoomPage can use it
    navigate(`/room/${roomId}`, { state: { email } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 left-1/4 w-125 h-125 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-125 h-125 bg-violet-600/15 rounded-full blur-3xl pointer-events-none translate-y-1/2" />
      <div className="absolute top-1/3 right-10 w-75 h-75 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      <ToastNotification
        message="Backend Room ID created and copied to clipboard!"
        isVisible={copiedNotification}
      />

      {/* Header Bar */}
      <HeaderBar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        <div className="lg:col-span-7 space-y-8">
          <HeroBanner />
          <JoinRoomForm
            email={email}
            setEmail={setEmail}
            roomId={roomId}
            setRoomId={setRoomId}
            isGenerating={isGenerating}
            errorMsg={errorMsg}
            onJoin={handleJoin}
            onGenerateRoomId={generateRoomId}
          />
          <TrustBadges />
        </div>
        <MeetingCardMockup />
      </main>

      <FeatureHighlights />
      <Footer />
    </div>
  );
}
