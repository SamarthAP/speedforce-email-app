
import React, { useState, useEffect, ReactNode } from 'react';
import { 
  ErrorBoundary, 
  captureException,
} from '@sentry/react';

type FallbackUIProps = {
  children: ReactNode;
}

const FallbackUI = (children: FallbackUIProps) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Function to handle the error and set the state to indicate an error has occurred
    const handleError = (error: Error, errorInfo: any): void => {
      // Log the error to Sentry
      captureException(error, { extra: errorInfo });
      // Set the state to indicate that an error has occurred
      setHasError(true);
    };

    // Initialize the error boundary
    const errorBoundary = new ErrorBoundary({ onError: handleError });

    // Clean up the error boundary when the component unmounts
    // return () => errorBoundary.uninstall();
  }, []);

  if (hasError) {
    // Render the fallback UI when an error occurs
    return (
      <div>
        <h1>Something went wrong.</h1>
        <p>We're sorry, but an error occurred.</p>
        {/* You can add additional information or a button to handle the error gracefully */}
      </div>
    );
  }

  // Render the children as the normal UI when no error occurs
  return <>{children}</>;
};

export default FallbackUI;