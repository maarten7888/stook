"use client";

import { useState, useEffect } from "react";
import { UserCard } from "@/components/user-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  requester: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  receiver: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function FriendRequestsList() {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [receivedRes, sentRes] = await Promise.all([
        fetch("/api/friends/requests?type=received"),
        fetch("/api/friends/requests?type=sent"),
      ]);

      if (receivedRes.ok) {
        const received = await receivedRes.json();
        setReceivedRequests(received || []);
      }

      if (sentRes.ok) {
        const sent = await sentRes.json();
        setSentRequests(sent || []);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept request");
      }

      toast.success("Vriendverzoek geaccepteerd");
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error(error instanceof Error ? error.message : "Kon verzoek niet accepteren");
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}/decline`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to decline request");
      }

      toast.success("Vriendverzoek geweigerd");
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error(error instanceof Error ? error.message : "Kon verzoek niet weigeren");
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel request");
      }

      toast.success("Vriendverzoek geannuleerd");
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error(error instanceof Error ? error.message : "Kon verzoek niet annuleren");
    }
  };

  if (loading) {
    return (
      <Card className="bg-coals border-ash">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-ember mx-auto mb-2" />
          <p className="text-smoke text-sm">Vriendverzoeken laden...</p>
        </CardContent>
      </Card>
    );
  }

  const totalRequests = receivedRequests.length + sentRequests.length;

  if (totalRequests === 0) {
    return (
      <Card className="bg-coals border-ash">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-ash flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-ember" />
            Vriendverzoeken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-smoke text-sm text-center py-4">
            Geen openstaande vriendverzoeken.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-coals border-ash">
      <CardHeader>
        <CardTitle className="text-lg font-heading text-ash flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-ember" />
          Vriendverzoeken
          {receivedRequests.length > 0 && (
            <Badge variant="secondary" className="bg-ember/20 text-ember">
              {receivedRequests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Received Requests */}
        {receivedRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-ash mb-3">
              Ontvangen ({receivedRequests.length})
            </h3>
            <div className="space-y-3">
              {receivedRequests.map((request) => (
                <div key={request.id} className="space-y-2">
                  <UserCard
                    userId={request.requester.id}
                    displayName={request.requester.display_name}
                    avatarUrl={request.requester.avatar_url}
                    showLink
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAccept(request.id)}
                      size="sm"
                      className="bg-ember hover:bg-ember/90"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accepteren
                    </Button>
                    <Button
                      onClick={() => handleDecline(request.id)}
                      size="sm"
                      variant="outline"
                      className="border-ash text-ash hover:bg-coals"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Weigeren
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-ash mb-3">
              Verzonden ({sentRequests.length})
            </h3>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div key={request.id} className="space-y-2">
                  <UserCard
                    userId={request.receiver.id}
                    displayName={request.receiver.display_name}
                    avatarUrl={request.receiver.avatar_url}
                    showLink
                  />
                  <Button
                    onClick={() => handleCancel(request.id)}
                    size="sm"
                    variant="outline"
                    className="border-ash text-ash hover:bg-coals"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Annuleren
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

