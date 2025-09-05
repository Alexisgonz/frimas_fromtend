import React, { useState } from 'react';
import './SignerMapper.css';

const SignerMapper = ({ 
  templateSubmitters = [], 
  mondayContacts = [], 
  onMappingChange,
  mapping = {}
}) => {
  const [localMapping, setLocalMapping] = useState(mapping);

  const handleRoleAssignment = (submitterUuid, contactEmail, contactName) => {
    const newMapping = {
      ...localMapping,
      [submitterUuid]: {
        email: contactEmail,
        name: contactName
      }
    };
    
    setLocalMapping(newMapping);
    if (onMappingChange) {
      onMappingChange(newMapping);
    }
  };

  const clearAssignment = (submitterUuid) => {
    const newMapping = { ...localMapping };
    delete newMapping[submitterUuid];
    
    setLocalMapping(newMapping);
    if (onMappingChange) {
      onMappingChange(newMapping);
    }
  };

  const isAllMapped = () => {
    return templateSubmitters.every(submitter => localMapping[submitter.uuid]);
  };

  const getAvailableContacts = (currentSubmitterUuid) => {
    // Obtener emails ya asignados a otros roles
    const assignedEmails = Object.entries(localMapping)
      .filter(([uuid]) => uuid !== currentSubmitterUuid)
      .map(([, assignment]) => assignment.email);

    // Filtrar contactos disponibles
    return mondayContacts.filter(contact => 
      !assignedEmails.includes(contact.email)
    );
  };

  if (!templateSubmitters || templateSubmitters.length === 0) {
    return (
      <div className="signer-mapper">
        <p className="no-submitters">
          Esta plantilla no tiene roles de firmantes definidos.
        </p>
      </div>
    );
  }

  if (!mondayContacts || mondayContacts.length === 0) {
    return (
      <div className="signer-mapper">
        <div className="error-message">
          <h4>⚠️ No se encontraron contactos</h4>
          <p>
            No se pudieron extraer emails del ítem de Monday. 
            Asegúrese de que el ítem tenga columnas de tipo "Email" o "Persona" 
            con direcciones de correo válidas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="signer-mapper">
      <h3>Asignar Firmantes</h3>
      <p className="instructions">
        Asigne cada rol de la plantilla a una persona del ítem de Monday:
      </p>

      <div className="mapping-grid">
        {templateSubmitters.map((submitter, index) => {
          const availableContacts = getAvailableContacts(submitter.uuid);
          const currentAssignment = localMapping[submitter.uuid];

          return (
            <div key={submitter.uuid} className="role-assignment">
              <div className="role-info">
                <h4>Rol {index + 1}: {submitter.name || `Firmante ${index + 1}`}</h4>
                {submitter.uuid && (
                  <span className="role-uuid">ID: {submitter.uuid}</span>
                )}
              </div>

              <div className="assignment-controls">
                <select
                  value={currentAssignment?.email || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedContact = mondayContacts.find(
                        contact => contact.email === e.target.value
                      );
                      if (selectedContact) {
                        handleRoleAssignment(
                          submitter.uuid,
                          selectedContact.email,
                          selectedContact.name
                        );
                      }
                    } else {
                      clearAssignment(submitter.uuid);
                    }
                  }}
                  className="contact-select"
                >
                  <option value="">Seleccionar firmante...</option>
                  {availableContacts.map((contact, contactIndex) => (
                    <option key={contactIndex} value={contact.email}>
                      {contact.name} ({contact.email})
                    </option>
                  ))}
                  {currentAssignment && !availableContacts.find(c => c.email === currentAssignment.email) && (
                    <option value={currentAssignment.email}>
                      {currentAssignment.name} ({currentAssignment.email}) [Asignado]
                    </option>
                  )}
                </select>

                {currentAssignment && (
                  <div className="current-assignment">
                    <span className="assigned-contact">
                      ✓ {currentAssignment.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => clearAssignment(submitter.uuid)}
                      className="clear-button"
                      title="Quitar asignación"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mapping-summary">
        <div className={`mapping-status ${isAllMapped() ? 'complete' : 'incomplete'}`}>
          {isAllMapped() ? (
            <span className="status-complete">
              ✓ Todos los roles han sido asignados ({Object.keys(localMapping).length}/{templateSubmitters.length})
            </span>
          ) : (
            <span className="status-incomplete">
              ⚠️ Faltan asignaciones ({Object.keys(localMapping).length}/{templateSubmitters.length})
            </span>
          )}
        </div>

        {Object.keys(localMapping).length > 0 && (
          <div className="mapping-preview">
            <h5>Resumen de asignaciones:</h5>
            <ul>
              {Object.entries(localMapping).map(([uuid, assignment]) => {
                const submitter = templateSubmitters.find(s => s.uuid === uuid);
                return (
                  <li key={uuid}>
                    <strong>{submitter?.name || 'Firmante'}:</strong> {assignment.name} ({assignment.email})
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignerMapper;
