import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

/**
 * Button shown on other users' profiles to start a DM conversation.
 * Navigates to /messages?with=<userId>
 */
export default function MessageButton({ targetUserId, targetUserName }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/messages?with=${targetUserId}`);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-full gap-2"
      onClick={handleClick}
    >
      <MessageCircle className="w-4 h-4" />
      Message
    </Button>
  );
}