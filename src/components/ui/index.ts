// Legacy components (for backwards compatibility)
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
export { Modal } from './Modal';
export { Card, CardHeader } from './Card';

// shadcn/ui components - re-export from legacy for now since shadcn didn't overwrite
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
export { Badge } from './badge';
export { Avatar, AvatarFallback, AvatarImage } from './avatar';
export { Skeleton } from './skeleton';
export { Separator } from './separator';
export { ScrollArea, ScrollBar } from './scroll-area';
export { Switch } from './switch';
export { Label } from './label';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu';
export { Spinner, LoadingOverlay, PageLoader, SkeletonCard, TableSkeleton } from './loader';

