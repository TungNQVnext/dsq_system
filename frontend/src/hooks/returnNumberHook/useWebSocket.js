import { useEffect, useRef } from "react";
import { API_URL } from "../../setting";

export const useWebSocket = () => {
  const wsRef = useRef(null);
  const subscriptions = useRef([]);

  useEffect(() => {
    const ws = new WebSocket(API_URL.replace(/^http/, "ws") + "/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.info(" WebSocket connected");
    };

    ws.onclose = () => {
      console.warn(" WebSocket disconnected");
    };

    ws.onmessage = (event) => {
      console.log(" Raw message received from WebSocket:", event.data);
      try {
        const message = JSON.parse(event.data);
        console.log(" Parsed WebSocket message:", message);
        console.log("Active subscriptions:", subscriptions.current)
        subscriptions.current.forEach((subscription) => {
          console.log(` Comparing types: expected=${subscription.messageType}, received=${message.type}`);
          if (
            subscription.messageType === "all" ||
            subscription.messageType === message.type
          ) {
            console.log(` Calling handler for type ${subscription.messageType}`);
            subscription.handler(message);
          }
        });
      } catch (error) {
        console.error(" Failed to parse WebSocket message:", error);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const subscribe = (messageType, handler) => {
    const id = Date.now().toString();
    subscriptions.current.push({ id, messageType, handler });
    return () => {
      subscriptions.current = subscriptions.current.filter((s) => s.id !== id);
    };
  };

  const send = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  const sendCallNotification = (number, spin, language, counter) => {
    return send({
      type: "call",
      number,
      metadata: {
        spin,
        language,
        counter,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const sendCompletion = (counter, number) => {
    return send({
      type: "complete",
      counter,
      number,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    subscribe,
    sendCallNotification,
    sendCompletion,
  };
};
