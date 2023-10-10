export const fetchUser = async (
  username: string,
  token: string,
): Promise<{ name: string; followers: number }> => {
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Authorization: `token ${token}`,
    },
  });

  const data = await response.json();
  return { name: data.name, followers: data.followers };
};

