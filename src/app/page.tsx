"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { GithubUser } from "@/models/github-user";
import { fetchUser } from "@/api/github/fetchUser";
import { logger } from "@/utils/console";

const App: React.FC = () => {
  const [fullName, setFullName] = useState<string>("");
  const [users, setUsers] = useState<GithubUser[]>([]);
  const [rateLimitReached, setRateLimitReached] = useState<boolean>(false);
  const [cache, setCache] = useState<Record<string, GithubUser[]>>({});

  useEffect(() => {
    const searchUsersByFullName = async () => {
      if (fullName in cache) {
        setUsers(cache[fullName]);
        return;
      }
      var token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      logger("Token: " + token);
      if (fullName) {
        try {
          const response = await fetch(
            `https://api.github.com/search/users?q=${encodeURIComponent(
              fullName
            )}`,
            token
              ? {
                  headers: {
                    Authorization: `token ${token}`,
                  },
                }
              : {}
          );

          if (response.status === 403) {
            setRateLimitReached(true);
            return;
          }

          const data: { items: GithubUser[] } = await response.json();

          const usersWithDetails = await Promise.all(
            data.items.map(async (user) => {
              const { name, followers } = await fetchUser(user.login, token!);
              return {
                ...user,
                name,
                followers,
              };
            })
          );

          const sortedUsers = usersWithDetails.sort(
            (a, b) => b.followers - a.followers
          );

          setCache((prevCache) => ({
            ...prevCache,
            [fullName]: sortedUsers,
          }));

          setUsers(sortedUsers);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUsers([]);
      }
    };

    const debounceSearch = setTimeout(searchUsersByFullName, 500);

    return () => clearTimeout(debounceSearch);
  }, [fullName, cache]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  var tokenPrint = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8 lg:py-16 ">
      <div className="h-56 grid grid-cols-3 gap-4 content-center">
        <div></div>
        <img src="teleparty.jpg" alt="TeleParty" className="mb-8" />
        <div></div>
      </div>
      <p>{tokenPrint}</p>

      <input
        autoComplete="given-name"
        name="search"
        type="text"
        placeholder="Search GitHub user by full name..."
        value={fullName}
        onChange={handleInputChange}
        className="px-2 block max-w-2xl w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
      <div className="sm:mb-8 sm:flex sm:justify-center">
        <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600">
          {rateLimitReached && (
            <p className="error-message">
              Rate limit exceeded! Please wait for a while and try again.
            </p>
          )}

          <table className="table-auto max-w-2xl">
            {users.length > 0 ? (
              <thead>
                <tr className="text-gray-300">
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Avatar</th>
                  <th>Follower Count</th>
                  <th>Profile</th>
                </tr>
              </thead>
            ) : (
              <thead>
                <tr></tr>
              </thead>
            )}
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="text-gray-300">
                  <td>{user.id}</td>
                  <td>{user.login}</td>
                  <td>{user.name}</td>
                  <td>
                    <img
                      src={user.avatar_url}
                      alt={`${user.login}'s avatar`}
                      width="50"
                    />
                  </td>
                  <td>{user.followers}</td>
                  <td>
                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Profile
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
