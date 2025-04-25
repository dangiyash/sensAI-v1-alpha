export default function CommunityFeed() {
    // Mock data - replace with API call
    const posts = [
      { id: 1, user: 'User1', content: 'Hello everyone!' },
      { id: 2, user: 'User2', content: 'Great to be here!' },
    ];
  
    return (
      <div>
        {posts.map((post) => (
          <div key={post.id} className="border p-4 mb-4 rounded">
            <p className="font-bold">{post.user}</p>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    );
  }