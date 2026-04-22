import { useCallback, useContext } from "react";
import { MyContext } from "../create_context/MyContext";

function useFetchMembers() {
  const { value, member, setMember } = useContext(MyContext);

  
  // const email = localStorage.getItem("email");

  const fetchMember = useCallback(async () => {
    try {
      const email = localStorage.getItem("email");
      const response = await fetch(`${import.meta.env.VITE_URL}/member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setMember(result);
    } catch (error) {
      console.error(error);
    }
  }, [value]); // depends on value change

  return { member, fetchMember };
}

export default useFetchMembers;