"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";

type FriendshipStatus = 'none' | 'friends' | 'request_sent' | 'request_received';

interface FriendRequestButtonProps {
  userId: string;
  className?: string;
}

export function FriendRequestButton({ userId, className }: FriendRequestButtonProps) {
  const [status, setStatus] = useState<FriendshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/friends/status/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();
        setStatus(data.status);
      } catch (error) {
        console.error("Error fetching friendship status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [userId]);

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send request");
      }

      setStatus('request_sent');
      toast.success("Vriendverzoek verzonden");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error(error instanceof Error ? error.message : "Kon vriendverzoek niet verzenden");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setActionLoading(true);
    try {
      // First get the request ID
      const requestsResponse = await fetch('/api/friends/requests?type=received');
      if (!requestsResponse.ok) throw new Error("Failed to fetch requests");
      const requests = await requestsResponse.json();
      const request = requests.find((r: { requester: { id: string } }) => r.requester.id === userId);
      
      if (!request) {
        throw new Error("Request not found");
      }

      const response = await fetch(`/api/friends/requests/${request.id}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept request");
      }

      setStatus('friends');
      toast.success("Vriendverzoek geaccepteerd");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error(error instanceof Error ? error.message : "Kon vriendverzoek niet accepteren");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    setActionLoading(true);
    try {
      // First get the request ID
      const requestsResponse = await fetch('/api/friends/requests?type=received');
      if (!requestsResponse.ok) throw new Error("Failed to fetch requests");
      const requests = await requestsResponse.json();
      const request = requests.find((r: { requester: { id: string } }) => r.requester.id === userId);
      
      if (!request) {
        throw new Error("Request not found");
      }

      const response = await fetch(`/api/friends/requests/${request.id}/decline`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to decline request");
      }

      setStatus('none');
      toast.success("Vriendverzoek geweigerd");
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error(error instanceof Error ? error.message : "Kon vriendverzoek niet weigeren");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setActionLoading(true);
    try {
      // First get the request ID
      const requestsResponse = await fetch('/api/friends/requests?type=sent');
      if (!requestsResponse.ok) throw new Error("Failed to fetch requests");
      const requests = await requestsResponse.json();
      const request = requests.find((r: { receiver: { id: string } }) => r.receiver.id === userId);
      
      if (!request) {
        throw new Error("Request not found");
      }

      const response = await fetch(`/api/friends/requests/${request.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel request");
      }

      setStatus('none');
      toast.success("Vriendverzoek geannuleerd");
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      toast.error(error instanceof Error ? error.message : "Kon vriendverzoek niet annuleren");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Button disabled className={className}>
        Laden...
      </Button>
    );
  }

  if (status === 'friends') {
    return (
      <Button disabled variant="outline" className={className}>
        <UserCheck className="h-4 w-4 mr-2" />
        Vrienden
      </Button>
    );
  }

  if (status === 'request_sent') {
    return (
      <Button 
        onClick={handleCancelRequest} 
        disabled={actionLoading}
        variant="outline" 
        className={className}
      >
        <Clock className="h-4 w-4 mr-2" />
        {actionLoading ? "Annuleren..." : "Verzoek verzonden"}
      </Button>
    );
  }

  if (status === 'request_received') {
    return (
      <div className="flex gap-2">
        <Button 
          onClick={handleAcceptRequest} 
          disabled={actionLoading}
          className={className}
        >
          <Check className="h-4 w-4 mr-2" />
          Accepteren
        </Button>
        <Button 
          onClick={handleDeclineRequest} 
          disabled={actionLoading}
          variant="outline"
          className={className}
        >
          <X className="h-4 w-4 mr-2" />
          Weigeren
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleSendRequest} 
      disabled={actionLoading}
      className={className}
    >
      <UserPlus className="h-4 w-4 mr-2" />
      {actionLoading ? "Verzenden..." : "Vriend toevoegen"}
    </Button>
  );
}

