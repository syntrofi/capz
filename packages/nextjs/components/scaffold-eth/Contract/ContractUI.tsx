import { useEffect, useState } from "react";

export const ContractUI = ({ contractName }: TContractUIProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // ... rest of your component code
}; 