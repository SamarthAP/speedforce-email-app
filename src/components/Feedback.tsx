import React, { useRef, useState } from "react";
import { PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";
import SimpleButton from "./SimpleButton";
import { saveFeedback } from "../api/feedback";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import Spinner from "./Spinner";

export default function FeedbackTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [descriptionText, setDescriptionText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [keepAnon, setKeepAnon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedEmail } = useEmailPageOutletContext();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setKeepAnon(false);
    setTitleText("");
    setDescriptionText("");
    setAttachments([]);
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      const hasDuplicates = files.some((newFile) =>
        attachments.some((existingFile) => existingFile.name === newFile.name)
      );

      if (hasDuplicates) {
        alert("File names must be unique.");
      } else {
        setAttachments([...attachments, ...files]);
      }
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const truncateFileName = (fileName: string, maxLength: number) => {
    if (fileName.length > maxLength) {
      const fileNameWithoutExtension = fileName
        .split(".")
        .slice(0, -1)
        .join(".");
      const extension = fileName.split(".").pop();
      return `${fileNameWithoutExtension.slice(
        0,
        maxLength - 4
      )}...${extension}`;
    }
    return fileName;
  };

  const removeAttachment = (
    index: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    const updatedAttachments = [...attachments];
    updatedAttachments.splice(index, 1);
    setAttachments(updatedAttachments);
  };

  async function makeRequest() {
    const params = {
      selectedEmail: selectedEmail.email,
      emailProvider: selectedEmail.provider,
      text: {
        title: titleText,
        description: descriptionText,
      },
      attachments: attachments,
      keepAnonymous: keepAnon,
    };
    const { data, error } = await saveFeedback(params);

    return { data, error };
  }

  const submitFeedback = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (titleText === "" || descriptionText === "") {
      alert("Please fill out all fields");
      return;
    } else {
      setIsSubmitting(true);
      const res = await makeRequest();

      if (res.error) {
        setIsSubmitting(false);
        alert("There was an error submitting your feedback");
        closeModal();
      } else {
        setIsSubmitting(false);
        alert("Feedback submitted successfully");
        closeModal();
      }
    }
  };

  return (
    <>
      <div
        className="w-full h-full cursor-pointer flex justify-center p-3"
        onClick={() => {
          openModal();
        }}
      >
        <p className="rotate-90 py-3.5 text-xs text-white dark:text-black">
          Feedback
        </p>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div
            className="modal-bg fixed inset-0 bg-white dark:bg-black opacity-60"
            onClick={closeModal}
          ></div>
          <form action="#" className="relative w-96">
            <XMarkIcon
              className="text-gray-500 dark:text-white w-5 h-5 absolute right-0 -top-6 cursor-pointer"
              onClick={closeModal}
            />
            <div className="overflow-hidden rounded-t-lg shadow-md">
              <label htmlFor="title" className="sr-only">
                Title
              </label>
              <input
                onChange={(e) => setTitleText(e.target.value)}
                maxLength={33}
                type="text"
                name="title"
                id="title"
                className="block w-full p-3 text-lg font-medium text-white dark:text-gray-900 placeholder:text-gray-50 dark:placeholder:text-gray-400 focus:ring-0 bg-gray-700 dark:bg-slate-200"
                placeholder="Title..."
              />
              <label htmlFor="description" className="sr-only">
                Description
              </label>
              <textarea
                onChange={(e) => setDescriptionText(e.target.value)}
                rows={4}
                name="description"
                id="description"
                className="block w-full resize-none border-0 py-3 px-3 text-white dark:text-gray-900 placeholder:text-gray-50 dark:placeholder:text-gray-400 focus:ring-0 bg-gray-600 dark:bg-slate-100"
                placeholder="Write a description..."
                defaultValue={""}
              />
            </div>
            <div className="pl-3 flex justify-start bg-gray-600 dark:bg-slate-100">
              <div className="flex h-6 items-center">
                <input
                  onClick={() => {
                    setKeepAnon(!keepAnon);
                    console.log(keepAnon);
                  }}
                  id="comments"
                  aria-describedby="comments-description"
                  name="comments"
                  type="checkbox"
                  className="h-3 w-3 rounded border-gray-300"
                />
              </div>
              <div className="ml-1 text-xs leading-6">
                <span
                  id="comments-description"
                  className="text-white dark:text-gray-900 underline"
                >
                  Keep Anonymous
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between space-x-3 rounded-b-lg border-slate-600 dark:border-slate-200 bg-gray-600 dark:bg-slate-100 px-2 py-2 sm:px-3">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="group -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-3.5 text-left text-gray-50 dark:text-gray-500"
                  >
                    <PaperClipIcon
                      className="-ml-1 mr-2 h-5 w-5 group-hover:text-blue-300"
                      aria-hidden="true"
                    />
                    <span className="text-sm italic text-gray-50 dark:text-gray-500 group-hover:text-blue-300">
                      Attach a file
                    </span>
                  </button>

                  {attachments.length > 0 && (
                    <>
                      <label className="block pt-3 text-sm text-gray-200 dark:text-gray-500 underline">
                        Attachments:
                      </label>
                      <div className="text-sm italic text-white dark:text-black">
                        <ul>
                          {attachments.map((file, index) => (
                            <li key={index}>
                              <button
                                onClick={(event) =>
                                  removeAttachment(index, event)
                                }
                                className="text-red-600 mr-2"
                              >
                                X
                              </button>
                              {truncateFileName(file.name, 20)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    multiple
                    onChange={handleFileUpload}
                  />
                </div>
                <div className="flex-shrink-0 absolute right-3 bottom-3">
                  {!isSubmitting ? (
                    <SimpleButton
                      onClick={(event) => {
                        void submitFeedback(event);
                      }}
                      loading={false}
                      text="Submit"
                      width="w-16"
                    />
                  ) : (
                    <Spinner className="w-5 h-5 mr-5 mb-1 !text-white dark:!text-gray-900" />
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
