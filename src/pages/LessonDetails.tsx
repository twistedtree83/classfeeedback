/* This is a partial file update focusing on the startTeaching function */

// Inside the LessonDetails component, find and update the startTeaching function:

  const startTeaching = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!lesson?.processed_content) return;

    if (!user?.user_metadata?.title || !user?.user_metadata?.full_name) {
      setError("Please set your title and name in your profile first");
      return;
    }

    setIsStartingTeaching(true);
    setError(null);

    const teacherName = `${
      user.user_metadata.title
    } ${user.user_metadata.full_name.split(" ").pop()}`;

    try {
      // Use the selected cards from the teaching cards manager
      if (selectedCards.length === 0) {
        throw new Error(
          "Please add at least one card to the teaching sequence"
        );
      }

      // Create a session first
      const session = await createSession(teacherName);
      if (!session) {
        throw new Error("Failed to create teaching session");
      }

      // Now create the lesson presentation with all required parameters
      console.log("Creating lesson presentation with:", {
        sessionId: session.id,
        sessionCode: session.code,
        lessonId: lesson.id,
        cardsCount: selectedCards.length,
        teacherName,
        wordleEnabled,
        wordleWord: wordleEnabled ? wordleWord : null,
      });

      const presentation = await createLessonPresentation(
        session.id,
        session.code,
        lesson.id,
        selectedCards, // Pass cards directly as they will be handled in the function
        teacherName,
        wordleEnabled ? wordleWord : null
      );

      if (!presentation) {
        throw new Error("Failed to create lesson presentation");
      }

      navigate(`/teach/${presentation.session_code}`);
    } catch (err: any) {
      console.error("Error starting teaching session:", err);

      // Provide more specific error messages
      let errorMessage = "Failed to start teaching session";
      if (err instanceof Error) {
        if (err.message.includes("Failed to create lesson presentation")) {
          errorMessage =
            "Unable to create lesson presentation. Please try again or contact support.";
        } else if (err.message.includes("Failed to create teaching session")) {
          errorMessage =
            "Unable to create teaching session. Please check your connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsStartingTeaching(false);
    }
  };