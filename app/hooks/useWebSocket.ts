import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
    type: string;
    item?: any;
    isGenerating?: boolean;
}

export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
    const [isConnected, setIsConnected] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const messageCallback = useRef(onMessage);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Update the callback ref when onMessage changes
    useEffect(() => {
        messageCallback.current = onMessage;
    }, [onMessage]);

    const sendMessage = useCallback((message: any) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
    }, []);

    const toggleGeneration = useCallback(() => {
        if (isGenerating) {
            sendMessage({ type: 'stop_generation' });
        } else {
            sendMessage({ type: 'start_generation' });
        }
    }, [isGenerating, sendMessage]);

    const connect = useCallback(function initializeWebSocket() {
        if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }

        try {
            // Check if WebSocket server is running first
            fetch('/api/websocket')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'WebSocket server running' && data.wsUrl) {
                        // Server is running, try to connect using the provided URL
                        if (ws.current) {
                            ws.current.close();
                        }

                        console.log('Connecting to WebSocket server at:', data.wsUrl);
                        ws.current = new WebSocket(data.wsUrl);

                        ws.current.onopen = () => {
                            console.log('WebSocket connected successfully');
                            setIsConnected(true);
                            reconnectAttempts.current = 0; // Reset attempts on successful connection
                            // Clear any existing reconnect timeout
                            if (reconnectTimeout.current) {
                                clearTimeout(reconnectTimeout.current);
                                reconnectTimeout.current = null;
                            }
                        };

                        ws.current.onclose = (event) => {
                            console.log('WebSocket disconnected:', event.code, event.reason);
                            setIsConnected(false);
                            setIsGenerating(false);
                            reconnectAttempts.current += 1;
                            // Try to reconnect after 2 seconds
                            if (reconnectAttempts.current < maxReconnectAttempts) {
                                console.log(`Reconnect attempt ${reconnectAttempts.current} of ${maxReconnectAttempts}`);
                                reconnectTimeout.current = setTimeout(initializeWebSocket, 2000);
                            }
                        };

                        ws.current.onerror = (error) => {
                            console.error('WebSocket error occurred:', error);
                            setIsConnected(false);
                            setIsGenerating(false);
                        };

                        ws.current.onmessage = (event) => {
                            try {
                                const message = JSON.parse(event.data);
                                if (message.type === 'generation_status') {
                                    setIsGenerating(message.isGenerating);
                                } else if (message.type === 'connected') {
                                    setIsGenerating(message.isGenerating);
                                }
                                messageCallback.current(message);
                            } catch (error) {
                                console.error('Error parsing WebSocket message:', error);
                            }
                        };
                    } else {
                        console.error('WebSocket server not running or URL not provided');
                        setIsConnected(false);
                        setIsGenerating(false);
                        // Try to reconnect after 5 seconds
                        if (reconnectAttempts.current < maxReconnectAttempts) {
                            reconnectTimeout.current = setTimeout(initializeWebSocket, 5000);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error checking WebSocket server status:', error);
                    setIsConnected(false);
                    setIsGenerating(false);
                    // Try to reconnect after 5 seconds
                    if (reconnectAttempts.current < maxReconnectAttempts) {
                        reconnectTimeout.current = setTimeout(initializeWebSocket, 5000);
                    }
                });
        } catch (error) {
            console.error('Error in WebSocket initialization:', error);
            setIsConnected(false);
            setIsGenerating(false);
            // Try to reconnect after 5 seconds
            if (reconnectAttempts.current < maxReconnectAttempts) {
                reconnectTimeout.current = setTimeout(initializeWebSocket, 5000);
            }
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    }, [connect]);

    return { isConnected, isGenerating, toggleGeneration };
} 