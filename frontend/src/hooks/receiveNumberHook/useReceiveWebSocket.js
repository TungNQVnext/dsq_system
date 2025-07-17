import { useEffect, useRef } from "react";
import { API_URL } from "../../setting";

export const useReceiveWebSocket = () => {
  const wsRef = useRef(null);
  const subscriptions = useRef([]);

  useEffect(() => {
    const ws = new WebSocket(API_URL.replace(/^http/, "ws") + "/receive-ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.info("Receive Number WebSocket connected");
    };

    ws.onclose = () => {
      console.warn("Receive Number WebSocket disconnected");
    };

    ws.onmessage = (event) => {
      console.log("Raw message received from Receive WebSocket:", event.data);
      try {
        const message = JSON.parse(event.data);
        console.log("Parsed Receive WebSocket message:", message);
        console.log("Active subscriptions:", subscriptions.current)
        subscriptions.current.forEach((subscription) => {
          console.log(`Comparing types: expected=${subscription.messageType}, received=${message.type}`);
          if (
            subscription.messageType === "all" ||
            subscription.messageType === message.type
          ) {
            console.log(`Calling handler for type ${subscription.messageType}`);
            subscription.handler(message);
          }
        });
      } catch (error) {
        console.error("Failed to parse Receive WebSocket message:", error);
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

  const sendCallNotification = (number, language, counter) => {
    return send({
      type: "call",
      number,
      metadata: {
        language,
        counter,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const sendCallNumberUpdate = (data) => {
    return send({
      type: "call_number_updated",
      data,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    subscribe,
    sendCallNotification,
    sendCallNumberUpdate,
  };
};
