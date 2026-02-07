import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-800 group-[.toaster]:border-gray-100 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-5 group-[.toaster]:min-w-[320px]",
          title: "group-[.toast]:font-bold group-[.toast]:text-base group-[.toast]:text-gray-800",
          description: "group-[.toast]:text-gray-500 group-[.toast]:text-sm group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-gradient-to-r group-[.toast]:from-orange-500 group-[.toast]:to-red-500 group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:shadow-lg group-[.toast]:shadow-orange-500/25",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:hover:bg-gray-200",
          success:
            "group-[.toaster]:border group-[.toaster]:border-green-100 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-white group-[.toaster]:to-green-50/30",
          error:
            "group-[.toaster]:border group-[.toaster]:border-red-100 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-white group-[.toaster]:to-red-50/30",
          info:
            "group-[.toaster]:border group-[.toaster]:border-orange-100 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-white group-[.toaster]:to-orange-50/30",
          warning:
            "group-[.toaster]:border group-[.toaster]:border-amber-100 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-white group-[.toaster]:to-amber-50/30",
          icon: "group-[.toast]:text-2xl group-[.toast]:mr-1",
          closeButton:
            "group-[.toast]:text-gray-400 group-[.toast]:hover:text-gray-600 group-[.toast]:transition-colors group-[.toast]:p-1 group-[.toast]:rounded-lg group-[.toast]:hover:bg-gray-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
