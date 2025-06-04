Here's the fixed version with all missing closing brackets added:

```javascript
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg shadow-md flex items-start gap-3 max-w-md border border-blue-200"
        >
          <Bell className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="flex-1">
            <div className="font-medium mb-1">Message from teacher:</div>
            <div>{teacherMessage.message}</div>
          </div>
          <button 
            onClick={() => setTeacherMessage(null)}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <main className="flex-1 flex">
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
          {currentCard && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(cardContent || '') }}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => handleTeachingFeedback('understand')}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px]"
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              I Understand
            </Button>

            <Button
              onClick={() => handleTeachingFeedback('confused')}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px]"
            >
              <ThumbsDown className="h-5 w-5 mr-2" />
              I'm Confused
            </Button>

            <Button
              onClick={() => setShowQuestionForm(true)}
              disabled={isSendingFeedback}
              variant="outline"
              className="flex-1 max-w-[200px]"
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              Ask Question
            </Button>

            {hasDifferentiatedContent ? (
              <Button
                onClick={toggleDifferentiatedView}
                disabled={isSendingFeedback}
                variant="outline"
                className="flex-1 max-w-[200px]"
              >
                <Split className="h-5 w-5 mr-2" />
                {viewingDifferentiated ? 'View Original' : 'View Simplified'}
              </Button>
            ) : (
              <Button
                onClick={handleGenerateDifferentiated}
                disabled={isSendingFeedback || generatingDifferentiated}
                variant="outline"
                className="flex-1 max-w-[200px]"
              >
                {generatingDifferentiated ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Split className="h-5 w-5 mr-2" />
                )}
                Simplify Content
              </Button>
            )}
          </div>
        </div>

        <MessagePanel
          show={showMessagePanel}
          onClose={toggleMessagePanel}
          messages={allMessages}
          teacherName={teacherName}
        />
      </main>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Ask a Question</h3>
            <form onSubmit={handleSendQuestion}>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="w-full h-32 p-3 border rounded-lg mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuestionForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!question.trim() || isSendingFeedback}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Send Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {(successMessage || error) && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg ${
          successMessage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {successMessage || error}
        </div>
      )}
    </div>
  );
}
```