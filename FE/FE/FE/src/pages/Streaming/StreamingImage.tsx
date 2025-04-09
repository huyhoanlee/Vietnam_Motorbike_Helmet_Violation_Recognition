import React, { useState, useEffect } from "react";
import useWebSocket from "react-use-websocket";

const WS_URL = "ws://localhost:8000/ws"; 

const StreamingImage: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string>("");

  const { lastMessage } = useWebSocket(WS_URL, { shouldReconnect: () => true });

  useEffect(() => {
    if (lastMessage?.data) {
      setImageSrc(`data:image/jpeg;base64,${lastMessage.data}`);
    }
  }, [lastMessage]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Streaming"
          className="rounded-lg shadow-xl border-4 border-blue-500"
          style={{ width: "640px", height: "480px" }}
        />
      ) : (
        <p className="text-white text-xl">Waiting for stream...</p>
      )}
    </div>
  );
};

export default StreamingImage;
