"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { GithubUser } from "../models/github-user";

const App: React.FC = () => {
  const [fullName, setFullName] = useState<string>('');
  const [users, setUsers] = useState<GithubUser[]>([]);
  const [rateLimitReached, setRateLimitReached] = useState<boolean>(false);
  const [cache, setCache] = useState<Record<string, GithubUser[]>>({});

  const fetchFullProfileForUser = async (username: string): Promise<{ name: string, followers: number }> => {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
      }
    });

    const data = await response.json();
    return { name: data.name, followers: data.followers };
  };

  useEffect(() => {
    const searchUsersByFullName = async () => {
      if (fullName in cache) {
        setUsers(cache[fullName]);
        return;
      }

      if (fullName) {
        try {
          const response = await fetch(
            `https://api.github.com/search/users?q=${encodeURIComponent(fullName)}`, 
            {
              headers: {
                Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
              }
            }
          );

          if (response.status === 403) {
            setRateLimitReached(true);
            return;
          }

          const data: { items: GithubUser[] } = await response.json();

          // Fetch followers and full name for each user
          const usersWithDetails = await Promise.all(data.items.map(async user => {
            const { name, followers } = await fetchFullProfileForUser(user.login);
            return {
              ...user,
              name,
              followers
            };
          }));

          const sortedUsers = usersWithDetails.sort((a, b) => b.followers - a.followers);

          setCache((prevCache) => ({
            ...prevCache,
            [fullName]: sortedUsers
          }));

          setUsers(sortedUsers);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUsers([]);  // Clear users if input is empty
      }
    };

    const debounceSearch = setTimeout(searchUsersByFullName, 500);  // Delay the search by 500ms to reduce the number of requests

    return () => clearTimeout(debounceSearch);  // Cleanup timeout on component unmount or re-render

  }, [fullName, cache]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  return (
    <div className="app">
      <div className="search-form">
        <input
          type="text"
          placeholder="Search GitHub user by full name..."
          value={fullName}
          onChange={handleInputChange}
        />
      </div>
      
      {rateLimitReached && <p className="error-message">Rate limit exceeded! Please wait for a while and try again.</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Full Name</th>
            <th>Avatar</th>
            <th>Follower Count</th>
            <th>Profile</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.login}</td>
              <td>{user.name}</td>
              <td><img src={user.avatar_url} alt={`${user.login}'s avatar`} width="50" /></td>
              <td>{user.followers}</td>
              <td><a href={user.html_url} target="_blank" rel="noopener noreferrer">View Profile</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
