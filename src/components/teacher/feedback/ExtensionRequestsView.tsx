import React from 'react';
import { Clock, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { formatTime } from '../../../lib/utils';
import { ExtensionRequest } from '../../../lib/supabase/types';

interface ExtensionRequestsViewProps {
  extensionRequests: ExtensionRequest[];
  onApprove: (requestId: string) => Promise<boolean>;
  onReject: (requestId: string) => Promise<boolean>;
  filterCurrentCard: boolean;
  currentCardIndex?: number;
}

export function ExtensionRequestsView({
  extensionRequests,
  onApprove,
  onReject,
  filterCurrentCard,
  currentCardIndex
}: ExtensionRequestsViewProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  // Filter requests based on currentCard if needed
  const filteredRequests = filterCurrentCard && currentCardIndex !== undefined
    ? extensionRequests.filter(req => req.card_index === currentCardIndex)
    : extensionRequests;
  
  // Separate pending and handled requests
  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const approvedRequests = filteredRequests.filter(req => req.status === 'approved');
  const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected');
  
  const handleApprove = async (requestId: string) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    try {
      await onApprove(requestId);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };
  
  const handleReject = async (requestId: string) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    try {
      await onReject(requestId);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };
  
  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No extension requests yet</p>
        <p className="text-sm">
          Students will request extension activities here when they finish their work early
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="font-medium mb-3 text-gray-800 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-purple-600" />
            Pending Extension Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-800">
                      {request.student_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(request.created_at)}
                      {request.card_index !== undefined && !filterCurrentCard && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          Card {request.card_index + 1}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      disabled={processingIds.has(request.id)}
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-700 hover:bg-green-50"
                    >
                      {processingIds.has(request.id) ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      disabled={processingIds.has(request.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-700 hover:bg-red-50"
                    >
                      {processingIds.has(request.id) ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Decline
                    </Button>
                  </div>
                </div>
                <p className="text-sm bg-white p-3 rounded border border-purple-100">
                  <span className="font-medium">Request:</span> Extension activity for {filterCurrentCard ? 'this card' : `Card ${request.card_index + 1}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <div>
          <h3 className="font-medium mb-3 text-gray-800 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Approved Requests ({approvedRequests.length})
          </h3>
          <div className="space-y-3">
            {approvedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-green-50 border border-green-200 rounded-lg p-4 opacity-80"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">
                      {request.student_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(request.created_at)}
                      {request.card_index !== undefined && !filterCurrentCard && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          Card {request.card_index + 1}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div>
          <h3 className="font-medium mb-3 text-gray-800 flex items-center">
            <XCircle className="h-4 w-4 mr-2 text-red-600" />
            Declined Requests ({rejectedRequests.length})
          </h3>
          <div className="space-y-3">
            {rejectedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-70"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">
                      {request.student_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(request.created_at)}
                      {request.card_index !== undefined && !filterCurrentCard && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          Card {request.card_index + 1}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Declined
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}