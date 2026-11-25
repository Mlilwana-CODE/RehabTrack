import Records from '@/components/Records';

export default function Page(){
 return <Records title="Rehabilitation" table="rehabilitation_actions" button="Add Rehabilitation Action" fields={[{name:'title',label:'Action',type:'text',required:true},{name:'site_id',label:'Site',type:'site'},{name:'status',label:'Status',type:'select',options:['Planned','In Progress','Completed','On Hold']},{name:'priority',label:'Priority',type:'select',options:['Low','Medium','High','Critical']},{name:'progress',label:'Progress (%)',type:'number'},{name:'due_date',label:'Due date',type:'date'}]}/>;
}
