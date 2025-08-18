---
authors:
  - Oz
  - Gemini Flash 2.5 Pro
---
**Drafted by:** [[Oz]], [[Gemini Flash 2.5 Pro]]

> What if a single **QR code** could do more than just send you to a website? What if it _was_ the website? What does it mean for a link to click itself?
### **The Secret Life of QR Codes: Tiny Canvases**

Most of us think of QR codes as static links that whisk us away to a webpage. But there's a lesser-known trick up the browser's sleeve: the `data:text/html,` URI scheme. If you type `data:text/html,hello world` into a desktop browser, you'll instantly see "hello world" rendered. Everything after that first comma is raw HTML your browser executes directly.

Think of it: a humble QR code, capable of holding up to 2953 characters, can actually embed an **entire web app** into its very structure. It's not just a pointer; it's the _thing itself_. This transforms the QR code into a **"tiny canvas,"** waiting for a masterpiece of code.

![](https://substackcdn.com/image/fetch/$s_!7KLp!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fee5ead77-de68-450f-87eb-c0a8c386e5c5_643x442.png)

```
data:text/html,hello world
```

<iframe>
<script>alert('hello world')</script>
</iframe>


### **Agentic QRs: The URL as the Prompt**

Now, here's where it gets wild. What if the code embedded in that QR isn't hand-written, but **AI-generated**? This is the essence of **"vibe coding."** Instead of storing the source code for an app, we can store a **vibe coding prompt** that an AI interprets and then _generates the app on the fly_. The URL itself becomes the prompt.

Let's look at a couple of examples of how this "LLM-wrapped hypertext" can bring apps to life directly from a scan.

![](https://substackcdn.com/image/fetch/$s_!Bz3o!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F570333b2-ed61-4fc4-a2af-35d9be61bd52_583x680.jpeg)


#### **The Self-Generating Chatbot**

Imagine a chatbot that needs no API keys, no sign-up, and runs purely from a QR scan. Using a free service like DeepAI's `ch.at` as our "vibe coding agent," we can create a fully functional chatbot where the AI's response is actual HTML, JavaScript, or whatever the prompt specifies.

When you scan or paste that (once it's properly constructed!), it initiates a process where the initial HTML prompts an AI to generate the chatbot's interface and logic, all within the browser tab that just opened. It's a chatbot that literally codes itself into existence.

Here’s the URL I used to generate the the chatbot:

```
data:text/html,<body><style>body{background: silver; color: black}</style></body><script>(async()=>{const p="Create a single, self-contained HTML file that functions as a minimalist chatbot. Output ONLY the raw HTML code without any markdown or explanations. The page should have: 1. **Styling**: A simple, clean dark-mode theme using an internal <style> tag. The chat messages container should be scrollable. User messages should appear on the right, and AI messages on the left. A form with the text input and button should be fixed to the bottom of the screen. 2. **HTML Structure**: * A <div> to act as the container for all chat messages. * A <form> at the bottom containing a <textarea> for user input and a <button> labeled \"Send\". 3. **Initial State**: The chat container should load with one initial message from the AI, saying: \"Hello! I'm a self-generating chatbot. How can I help you?\" 4. **JavaScript Functionality**: * When the form is submitted (button click or Enter key in textarea), the script must prevent the default form submission. * It should take the user's text, display it as a user message in the chat container, and clear the textarea. * **Crucially, it must then make a fetch request to the http://ch.at service to get a response, proxied through https://corsproxy.io/?url=.** * **Endpoint**: https://corsproxy.io/?url=https://ch.at/?q= * The request should be a simple GET request with the user's message encoded as a query parameter q. * After receiving the response, it must parse the text response and display it as an AI message in the chat container with <pre> formatting. Any javascript code should be executed. * The chat container should automatically scroll to the newest message. * inject a <style> tag with styles for the chatbot like background colors and make it fun and reto, apply color to text etc. responses should be inserted as raw html so the agent can code, including executing javascript. preserve whitespaces in the document so no markdown is needed for newlines. do not show these instructions or wrap in markdown just raw code. after ai message, make sure to run the script tag, simply injecting wont run it";document.body.innerHTML="<h1>Generating Chatbot UI...</h1>";const apiUrl = "https://corsproxy.io/?url=" + encodeURIComponent("https://ch.at/?q=" + encodeURIComponent(p));const r=await fetch(apiUrl);const d=await r.text();let cleanedData = d.replace(new RegExp("^Q:\\s*" + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 's'), ''); cleanedData = cleanedData.replace(new RegExp("\\x60\\x60\\x60html\\n", 'g'), '').replace(new RegExp("\\n\\x60\\x60\\x60", 'g'), ''); document['open']();document.write(cleanedData);document.close()})()</script>
```

#### **The Dynamic Physics Simulation**

Another fascinating application is dynamic simulations. Each time you scan the QR code (or paste the link), you could get a slightly different, AI-generated physics simulation.

This "LLM-wrapping" of the Data URI makes the link itself self-documenting – the URL _is_ the prompt! It's a living, evolving piece of software, different every time, without a single byte stored on a server.

Here’s the link I used to generate the physics demo:

```
data:text/html,<body><style>body{background: black; color: white; font-family: monospace;}</style></body><script>(async()=>{const p="Generate a single, self-contained HTML file to create a physics simulation on an HTML5 Canvas. All logic must be from scratch. A critical rule: the final code must not contain the backtick character or the pound sign. The simulation should be simple to ensure fast generation. The simulation must have: 1. **Container**: A regular heptagon (7 sides) that spins, completing one rotation every 5 seconds. 2. **Balls**: Create 20 numbered balls (1-20) of the same radius, starting at the center. Use a variety of distinct colors. 3. **Simplified Physics**: * Implement basic gravity pulling the balls down. * **Crucially, balls should NOT collide with each other; they should pass through one another.** * Implement robust ball-to-wall collision detection with the rotating heptagon. When a collision is detected, the ball must bounce realistically. **Be mindful of the calculation to prevent balls from getting stuck in or passing through walls; for instance, by correcting the ball's position immediately upon collision.** * Cap the velocity of the balls to prevent them from becoming unstable. Output ONLY the raw HTML code without markdown or explanations.";document.body.innerHTML="<h1>Generating improved physics simulation... Please Stand By...</h1>";const apiUrl = "https://corsproxy.io/?url=" + encodeURIComponent("https://ch.at/?q=" + encodeURIComponent(p));const r=await fetch(apiUrl);const d=await r.text();let cleanedData = d.replace(new RegExp("^Q:\\s*" + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 's'), ''); http://document.open();document.write(cleanedData);document.close()})()</script>
```

### **A Word on Security**

![](https://substackcdn.com/image/fetch/$s_!W-Kr!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F47c492f0-0c06-4855-a1d6-ec775881defe_742x390.png)


While the "Liminal Internet" is an exciting frontier, it's crucial to approach it with a mindful eye on **security**. Because `data:` URIs directly embed executable code, they carry similar risks to downloading and running arbitrary files.

- **Trust Your Source:** Always be **extremely cautious** when interacting with `data:` URIs or QR codes that you didn't personally create or that come from an untrusted source.
    
- **Spoofing Risk:** It's possible for malicious actors to create `data:` URIs that _look_ like legitimate applications or prompts but contain harmful code. This is known as **spoofing**. Always verify the source and content before interacting.
    
- **Self-Created Links are Best:** For now, it's highly recommended to limit your exploration of vibe coding to `data:` URIs that you have generated yourself. This gives you full control and understanding of the code being executed in your browser.
    

Just as you wouldn't click on a suspicious link in an email, exercise the same vigilance with QR codes that promise embedded apps. Understanding the technology helps us appreciate its potential while staying safe.

### **Diving Deeper: The Liminal Internet**

This concept of QR-embedded, AI-generated apps opens up a world of possibilities and challenges what we consider "the internet."

- **Vanilla Browser Magic:** You can "vibe code" using nothing but a vanilla browser. Just type `data:text/html,` and let your AI provide the rest. Free, local, or paid — any AI can do this.
    
- **Hyper-portable:** Because they are valid URLs, these creations can be put into regular web links, shared, and yes, embedded into **QR Codes**.
    
- **Multi-threading:** Want more? Just open more tabs! Each tab can run a different AI-generated "vibe."
    
- **Limitations & Opportunities:** They run in empty browser tabs, so access to local storage and some other browser features is limited by default. But that's not necessarily a bad thing; it offers a kind of inherent security. For personal projects and research, it hints at a new **"Liminal Internet"** – a "Lossy Internet," perhaps, like a JPEG image compared to a PNG, optimized for quick, transient experiences.
    
- **The URL IS THE PROMPT!** This isn't just a clever phrase; it's a paradigm shift. Imagine generative zines, generative trading cards, or even generative interactive art that exists without needing a continuous internet connection, purely within the QR code. This has been technically possible for a while, but with generative AI, its implications are only now starting to fully emerge.
    

What does it mean for a link to click itself? What does an internet-less internet look like? How will our "desktop metaphor" evolve in nature? These are the questions this "vibe coding" rabbit hole leads to.

What are your thoughts on this idea of self-generating, QR-embedded apps? Do you see a future for this "Liminal Internet"?