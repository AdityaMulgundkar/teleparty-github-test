export const fetchUser = async (
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
