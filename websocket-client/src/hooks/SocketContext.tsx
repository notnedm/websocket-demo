import Stomp, { Client } from "@stomp/stompjs";
import { useEffect, useState } from "react";

const SOCKET_URL = "ws://localhost:8080/ws";

interface SocketProps {
  subscriptions: Record<string, (message: Stomp.Message) => void>;
  onDisconnect?: () => void;
}

export const useSocket = ({ subscriptions, onDisconnect }: SocketProps) => {
  const [stompClient, setStompClient] = useState<Client>();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const client = new Client({
      brokerURL: SOCKET_URL,
      onConnect: () => {
        setIsConnected(true);
        let username = "";

        username = prompt("Enter username", "User")?.trim() ?? "";

        setUserId(username);
        client.publish({
          destination: "/app/join",
          body: JSON.stringify({ name: username }),
        });
        Object.entries(subscriptions).forEach(([topic, callback]) =>
          client.subscribe(topic, callback)
        );
        client.subscribe("disconnect", () => console.log("disconnected"));
      },
      onDisconnect: () => {
        setIsConnected(false);
        if (typeof onDisconnect !== "undefined") onDisconnect();
      },
    });

    client.activate();

    setStompClient(client);

    return () => {
      try {
        client.forceDisconnect();
      } catch (err) {
        console.error(err);
      }
    };
  }, []);

  return { client: stompClient, userId, isConnected };
};
