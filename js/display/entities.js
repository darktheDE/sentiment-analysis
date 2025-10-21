// ================================
// Display Entities Table
// ================================

import { elements } from '../dom.js';
import { escapeHtml } from '../ui/state.js';

export function displayEntities(data) {
    const entities = Array.isArray(data.detectedEntities) ? data.detectedEntities : [];
    
    if (entities.length === 0) {
        elements.entitiesContainer.innerHTML = '<p>Không tìm thấy thực thể nào.</p>';
        return;
    }
    
    let html = `
        <table class="entities-table">
            <thead>
                <tr>
                    <th>Văn bản</th>
                    <th>Loại</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    entities.forEach(entity => {
        const text = entity.text || entity.Text || '';
        const type = entity.type || entity.Type || 'UNKNOWN';
        
        html += `
            <tr>
                <td><strong>${escapeHtml(text)}</strong></td>
                <td><span class="entity-type">${type}</span></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    elements.entitiesContainer.innerHTML = html;
}
