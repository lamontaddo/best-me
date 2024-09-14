import React, { useState, useRef, useEffect } from 'react';
import './assets/App.css'; // Import your CSS file

function App() {
  const [response, setResponse] = useState('');
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false); // State for typing indicator
  const [userName, setUserName] = useState(''); // State for user's name
  const messagesEndRef = useRef(null); // Ref for scrolling to the end

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newMessage = { role: 'user', content: userInput };
    setMessages([...messages, newMessage]);
    setUserInput('');
    setIsTyping(true); // Show typing indicator

    try {
      const apiKey = API_KEY; // Replace with your OpenAI API key
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [...messages, newMessage]
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error fetching data:', errorData);
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      if (data.choices && data.choices.length > 0) {
        let aiMessageContent = data.choices[0].message.content;

        // Personalize response based on the user's name
        if (userName && aiMessageContent.includes('Hello')) {
          aiMessageContent = aiMessageContent.replace('Hello', `Hello ${userName}`);
        } else if (!userName && newMessage.content.toLowerCase().includes('my name is')) {
          const name = newMessage.content.split('my name is ')[1].trim();
          setUserName(name);
          aiMessageContent = `Nice to meet you, ${name}! How can I help you today?`;
        }

        const aiMessage = { role: 'assistant', content: aiMessageContent };
        setMessages([...messages, newMessage, aiMessage]);
      } else {
        setResponse('No response from the API');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setResponse('Error fetching data');
    } finally {
      setIsTyping(false); // Hide typing indicator when done
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the messages container when messages change
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
              <div ref={messagesEndRef} /> {/* Ref for scrolling */}
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
