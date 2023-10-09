"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { GithubUser } from "../models/github-user";

const App: React.FC = () => {
  const [fullName, setFullName] = useState<string>("");
  const [users, setUsers] = useState<GithubUser[]>([]);
  const [rateLimitReached, setRateLimitReached] = useState<boolean>(false);
  const [cache, setCache] = useState<Record<string, GithubUser[]>>({});

  const fetchFullProfileForUser = async (
    username: string
  ): Promise<{ name: string; followers: number }> => {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
      },
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
            `https://api.github.com/search/users?q=${encodeURIComponent(
              fullName
            )}`,
            {
              headers: {
                Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
              },
            }
          );

          if (response.status === 403) {
            setRateLimitReached(true);
            return;
          }

          const data: { items: GithubUser[] } = await response.json();

          // Fetch followers and full name for each user
          const usersWithDetails = await Promise.all(
            data.items.map(async (user) => {
              const { name, followers } = await fetchFullProfileForUser(
                user.login
              );
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
        setUsers([]); // Clear users if input is empty
      }
    };

    const debounceSearch = setTimeout(searchUsersByFullName, 500); // Delay the search by 500ms to reduce the number of requests

    return () => clearTimeout(debounceSearch); // Cleanup timeout on component unmount or re-render
  }, [fullName, cache]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  return (
    <div className="app">
      <div className="bg-black">
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
          </div>

          <div className="mx-auto max-w-2xl py-4 sm:py-8 lg:py-16 ">
            <div className="h-56 grid grid-cols-3 gap-4 content-center">
              <div></div>
              <img src="teleparty.jpg" alt="TeleParty" className="mb-8" />
              <div></div>
            </div>

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
        </div>
      </div>
    </div>
  );
};

export default App;
