import { Input } from 'antd';
import type { PasswordProps } from 'antd/es/input';

export function PasswordInput(props: PasswordProps) {
  return <Input.Password {...props} />;
}
