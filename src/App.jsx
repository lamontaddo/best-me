import React, { useState, useRef, useEffect } from 'react';
import './assets/App.css'; // Import your CSS file

function App() {
  const [response, setResponse] = useState('');
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hello! What is your name?' }]); // Initial message
  const [isTyping, setIsTyping] = useState(false); // State for typing indicator
  const [userName, setUserName] = useState(''); // State for user's name
  const [userId, setUserId] = useState(null); // State for MongoDB user _id
  const messagesEndRef = useRef(null); // Ref for scrolling to the end

  // Fetch messages from MongoDB when the userId is set
  useEffect(() => {
    if (userId) {
      const fetchUserMessages = async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/user/${userId}`);
          const data = await res.json();
          setMessages([{ role: 'assistant', content: 'Hello! What is your name?' }, ...data.messages]);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      fetchUserMessages();
    }
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newMessage = { role: 'user', content: userInput };
    setMessages([...messages, newMessage]);
    setUserInput('');
    setIsTyping(true);

    try {
      // If user name is not set, create user
      if (!userId) {
        const userName = userInput.trim();
        const createdUser = await createUser(userName);
        setUserId(createdUser._id);
        setUserName(userName);

        // Initial assistant response after user creation
        const aiMessage = { role: 'assistant', content: `Nice to meet you, ${userName}! How can I help you today?` };
        setMessages([...messages, newMessage, aiMessage]);

        // Save initial messages to the user in MongoDB
        await saveMessages(createdUser._id, [newMessage, aiMessage]);
        return; // End the function here to prevent further execution
      }

      // Otherwise, proceed with regular message handling
      await saveMessages(userId, [newMessage]);

      // Fetch AI response and save it as well
      const aiMessage = await fetchAIResponse([...messages, newMessage]);
      setMessages([...messages, newMessage, aiMessage]);

      // Save AI response
      await saveMessages(userId, [aiMessage]);

    } catch (error) {
      console.error('Error fetching data:', error);
      setResponse('Error fetching data');
    } finally {
      setIsTyping(false);
    }
  };

  const createUser = async (name) => {
    try {
      const res = await fetch('http://localhost:3000/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Error creating user: ${errorData.error}`);
      }
      return await res.json();
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  const saveMessages = async (userId, messagesToSave) => {
    try {
      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          messages: messagesToSave,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error saving messages: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const fetchAIResponse = async (messages) => {
    const apiKey = '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'; // Replace with your OpenAI API key
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error fetching data:', errorData);
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    if (data.choices && data.choices.length > 0) {
      return { role: 'assistant', content: data.choices[0].message.content };
    } else {
      throw new Error('No response from the API');
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="App">
      <header className="App-header">
        <img src="/bestMe.JPG" alt="Avatar" className="avatar" />
        <h1>Chat with Your Best Self</h1>
        <div className="chat-container">
          <div className="chat-box">
            <div className="messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {isTyping && (
                <div className="typing-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="chat-form">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="input-box"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </div>
        </div>
        <p>{response}</p>
      </header>
    </div>
  );
}

export default App;
