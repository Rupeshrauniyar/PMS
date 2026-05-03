import { useSearchParams } from "react-router-dom";

const Success = () => {
  const [params] = useSearchParams();

  const data = params.get("data");

  const decoded = JSON.parse(atob(data));

  console.log(decoded);

  return <div>Payment Successful</div>;
};

export default Success;
