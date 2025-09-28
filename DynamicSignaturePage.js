import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemType = {
  COMPONENT: 'component',
};

const DraggableComponent = ({ id, onDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType.COMPONENT,
    item: { id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      Component {id}
      <button onClick={() => onDelete(id)}>Delete</button>
    </div>
  );
};

const DynamicSignaturePage = () => {
  const [components, setComponents] = useState([]);

  const addComponent = () => {
    setComponents((prev) => [...prev, prev.length]);
  };

  const deleteComponent = (id) => {
    setComponents((prev) => prev.filter((compId) => compId !== id));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <h1>Dynamic Signature Page</h1>
      <button onClick={addComponent}>Add Component</button>
      <div>
        {components.map((id) => (
          <DraggableComponent key={id} id={id} onDelete={deleteComponent} />
        ))}
      </div>
    </DndProvider>
  );
};

export default DynamicSignaturePage;