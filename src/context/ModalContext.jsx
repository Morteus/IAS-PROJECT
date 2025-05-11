import React, { createContext, useContext, useState } from "react";

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalContent, setModalContent] = useState(null);

  const openModal = (content) => {
    if (!content) return;
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modalContent && (
        <div className="global-modal-overlay">
          <div className="global-modal-content">{modalContent}</div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
